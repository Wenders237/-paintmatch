"""
PaintMatch — Vues transactions (devis, réservations).

Endpoints clients :
  POST   /api/transactions/quote-requests/               → Créer une demande de devis
  GET    /api/transactions/quote-requests/               → Mes demandes de devis
  GET    /api/transactions/quote-requests/<id>/          → Détail d'une demande
  DELETE /api/transactions/quote-requests/<id>/          → Annuler une demande
  GET    /api/transactions/quotes/client/                → Mes devis reçus
  POST   /api/transactions/quotes/<id>/respond/          → Accepter/refuser un devis
  GET    /api/transactions/bookings/client/              → Mes réservations

Endpoints peintre :
  GET    /api/transactions/quote-requests/painter/       → Demandes reçues
  POST   /api/transactions/quotes/                       → Créer un devis
  PATCH  /api/transactions/quotes/<id>/                  → Modifier un devis
  POST   /api/transactions/quotes/<id>/send/             → Envoyer le devis
  GET    /api/transactions/bookings/painter/             → Mes réservations peintre
  POST   /api/transactions/ai-assist/                    → Assistance IA devis
"""

import logging
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction

from apps.accounts.permissions import IsClient, IsPeintre, IsValidatedPeintre
from .models import QuoteRequest, Quote, QuoteItem, Booking
from .serializers import (
    QuoteRequestSerializer, QuoteSerializer, QuoteWriteSerializer,
    QuoteClientActionSerializer, BookingSerializer, AIQuoteAssistSerializer,
)
from .ai_assistant import generate_quote_suggestion

logger = logging.getLogger('paintmatch')


# ---------------------------------------------------------------------------
# Demandes de devis — côté CLIENT
# ---------------------------------------------------------------------------

class ClientQuoteRequestListView(generics.ListCreateAPIView):
    """
    GET  /api/transactions/quote-requests/  → Mes demandes
    POST /api/transactions/quote-requests/  → Créer une demande
    """
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = QuoteRequestSerializer

    def get_queryset(self):
        return QuoteRequest.objects.filter(
            client=self.request.user
        ).select_related('painter__user', 'category').order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save()
        # Notifier le peintre
        try:
            from apps.notifications.service import notify_new_quote_request
            notify_new_quote_request(instance)
        except Exception as e:
            logger.error(f'Notification nouvelle demande : {e}')


class ClientQuoteRequestDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/transactions/quote-requests/<id>/  → Détail
    DELETE /api/transactions/quote-requests/<id>/  → Annuler
    """
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = QuoteRequestSerializer

    def get_queryset(self):
        return QuoteRequest.objects.filter(client=self.request.user)

    def perform_destroy(self, instance):
        if instance.status not in [QuoteRequest.Status.EN_ATTENTE]:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Seules les demandes en attente peuvent être annulées.')
        instance.status = QuoteRequest.Status.ANNULE
        instance.save()


# ---------------------------------------------------------------------------
# Demandes de devis — côté PEINTRE
# ---------------------------------------------------------------------------

class PainterQuoteRequestListView(generics.ListAPIView):
    """GET /api/transactions/quote-requests/painter/ → Demandes reçues."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class   = QuoteRequestSerializer

    def get_queryset(self):
        return QuoteRequest.objects.filter(
            painter=self.request.user.painter_profile,
            status__in=[QuoteRequest.Status.EN_ATTENTE, QuoteRequest.Status.REPONDU],
        ).select_related('client', 'category').order_by('-created_at')


# ---------------------------------------------------------------------------
# Devis — côté PEINTRE
# ---------------------------------------------------------------------------

class PainterQuoteCreateView(generics.CreateAPIView):
    """POST /api/transactions/quotes/ → Créer un devis."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class   = QuoteWriteSerializer

    def perform_create(self, serializer):
        request_id = self.request.data.get('request_id')
        quote_request = get_object_or_404(
            QuoteRequest,
            id=request_id,
            painter=self.request.user.painter_profile,
        )
        # Vérifier qu'il n'y a pas déjà un devis
        if hasattr(quote_request, 'quote'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Un devis existe déjà pour cette demande.')

        quote = serializer.save(
            request=quote_request,
            painter=self.request.user.painter_profile,
        )
        # Mettre à jour le statut de la demande
        quote_request.status = QuoteRequest.Status.REPONDU
        quote_request.save()


class PainterQuoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/transactions/quotes/<id>/  → Lire
    PATCH  /api/transactions/quotes/<id>/  → Modifier (brouillon seulement)
    DELETE /api/transactions/quotes/<id>/  → Supprimer (brouillon seulement)
    """
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class   = QuoteWriteSerializer
    http_method_names  = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Quote.objects.filter(painter=self.request.user.painter_profile)

    def perform_destroy(self, instance):
        if instance.status != Quote.Status.BROUILLON:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Seul un devis en brouillon peut être supprimé.')
        instance.delete()


class PainterSendQuoteView(APIView):
    """POST /api/transactions/quotes/<id>/send/ → Envoyer le devis au client."""
    permission_classes = [IsAuthenticated, IsPeintre]

    def post(self, request, pk):
        quote = get_object_or_404(
            Quote,
            id=pk,
            painter=request.user.painter_profile,
            status=Quote.Status.BROUILLON,
        )
        if not quote.items.exists():
            return Response(
                {'error': 'Le devis doit contenir au moins une ligne.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        quote.status  = Quote.Status.ENVOYE
        quote.sent_at = timezone.now()
        quote.save()
        logger.info(f'Devis envoyé : {quote.id} par {request.user.email}')
        # Notifier le client
        try:
            from apps.notifications.service import notify_quote_sent
            notify_quote_sent(quote)
        except Exception as e:
            logger.error(f'Notification devis envoyé : {e}')
        return Response({'message': 'Devis envoyé.', 'status': quote.status})


# ---------------------------------------------------------------------------
# Devis — côté CLIENT
# ---------------------------------------------------------------------------

class ClientQuoteListView(generics.ListAPIView):
    """GET /api/transactions/quotes/client/ → Devis reçus."""
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = QuoteSerializer

    def get_queryset(self):
        return Quote.objects.filter(
            request__client=self.request.user,
            status__in=[Quote.Status.ENVOYE, Quote.Status.ACCEPTE, Quote.Status.REFUSE],
        ).prefetch_related('items').select_related('painter__user', 'request').order_by('-sent_at')


class ClientQuoteDetailView(generics.RetrieveAPIView):
    """GET /api/transactions/quotes/<id>/ → Détail d'un devis."""
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = QuoteSerializer

    def get_queryset(self):
        return Quote.objects.filter(request__client=self.request.user)


class ClientRespondQuoteView(APIView):
    """
    POST /api/transactions/quotes/<id>/respond/
    Client accepte ou refuse un devis.
    Si accepté → crée automatiquement une Booking.
    """
    permission_classes = [IsAuthenticated, IsClient]

    @db_transaction.atomic
    def post(self, request, pk):
        quote = get_object_or_404(
            Quote,
            id=pk,
            request__client=request.user,
            status=Quote.Status.ENVOYE,
        )
        serializer = QuoteClientActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        note   = serializer.validated_data.get('note', '')

        quote.status      = action
        quote.client_note = note
        quote.save()

        booking = None
        if action == Quote.Status.ACCEPTE:
            booking = Booking.objects.create(
                quote=quote,
                client=request.user,
                painter=quote.painter,
                scheduled_date=quote.request.desired_start_date,
            )
            logger.info(f'Réservation créée : {booking.id} suite devis {quote.id}')
            # Notifier le peintre
            try:
                from apps.notifications.service import notify_quote_accepted
                notify_quote_accepted(quote)
            except Exception as e:
                logger.error(f'Notification devis accepté : {e}')
        elif action == Quote.Status.REFUSE:
            # Notifier le peintre
            try:
                from apps.notifications.service import notify_quote_refused
                notify_quote_refused(quote)
            except Exception as e:
                logger.error(f'Notification devis refusé : {e}')

        return Response({
            'message': f'Devis {"accepté" if action == "ACCEPTE" else "refusé"}.',
            'status':  action,
            'booking_id': str(booking.id) if booking else None,
        })


# ---------------------------------------------------------------------------
# Réservations
# ---------------------------------------------------------------------------

class ClientBookingListView(generics.ListAPIView):
    """GET /api/transactions/bookings/client/ → Réservations du client."""
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            client=self.request.user
        ).select_related('painter__user', 'quote').prefetch_related('progress_updates')


class PainterBookingListView(generics.ListAPIView):
    """GET /api/transactions/bookings/painter/ → Réservations du peintre."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            painter=self.request.user.painter_profile
        ).select_related('client', 'quote').prefetch_related('progress_updates')


# ---------------------------------------------------------------------------
# Assistance IA
# ---------------------------------------------------------------------------

class AIQuoteAssistView(APIView):
    """
    POST /api/transactions/ai-assist/
    Génère une structure de devis suggérée basée sur la demande.
    Réservé aux peintres validés.
    """
    permission_classes = [IsAuthenticated, IsPeintre]

    def post(self, request):
        serializer = AIQuoteAssistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quote_request = get_object_or_404(
            QuoteRequest,
            id=serializer.validated_data['quote_request_id'],
            painter=request.user.painter_profile,
        )

        suggestion = generate_quote_suggestion(quote_request)

        logger.info(
            f'Assistance IA utilisée par {request.user.email} '
            f'pour la demande {quote_request.id}'
        )

        return Response(suggestion)


# ---------------------------------------------------------------------------
# Détail d'une réservation
# ---------------------------------------------------------------------------

class BookingDetailView(generics.RetrieveAPIView):
    """
    GET /api/transactions/bookings/<id>/
    Détail complet d'une réservation avec suivi des travaux.
    Accessible au client et au peintre concernés.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = BookingSerializer

    def get_object(self):
        user    = self.request.user
        booking = get_object_or_404(Booking, id=self.kwargs['pk'])

        # Vérification d'accès : seuls le client ou le peintre peuvent voir
        if user.role == 'CLIENT' and booking.client != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        if user.role == 'PEINTRE' and booking.painter != user.painter_profile:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()

        return booking


# ---------------------------------------------------------------------------
# Actions sur la réservation (peintre)
# ---------------------------------------------------------------------------

class PainterBookingActionView(APIView):
    """
    POST /api/transactions/bookings/<id>/action/
    Le peintre confirme, démarre ou termine une réservation.
    Body : { action: 'CONFIRME' | 'EN_COURS' | 'TERMINE' }
    """
    permission_classes = [IsAuthenticated, IsPeintre]

    VALID_TRANSITIONS = {
        Booking.Status.EN_ATTENTE: [Booking.Status.CONFIRME, Booking.Status.ANNULE],
        Booking.Status.CONFIRME:   [Booking.Status.EN_COURS, Booking.Status.ANNULE],
        Booking.Status.EN_COURS:   [Booking.Status.TERMINE],
    }

    def post(self, request, pk):
        booking = get_object_or_404(
            Booking,
            id=pk,
            painter=request.user.painter_profile,
        )
        new_status = request.data.get('action')

        allowed = self.VALID_TRANSITIONS.get(booking.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Transition invalide : {booking.status} → {new_status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = new_status
        booking.save()

        # Notifications selon le nouveau statut
        try:
            from apps.notifications.service import notify_booking_confirmed, notify_work_finished
            if new_status == Booking.Status.CONFIRME:
                notify_booking_confirmed(booking)
            elif new_status == Booking.Status.TERMINE:
                notify_work_finished(booking)
        except Exception as e:
            logger.error(f'Notification réservation : {e}')

        logger.info(f'Réservation {booking.id} : {booking.status} par peintre {request.user.email}')

        return Response({
            'message': f'Statut mis à jour : {new_status}',
            'status':  new_status,
        })


# ---------------------------------------------------------------------------
# Actions sur la réservation (client)
# ---------------------------------------------------------------------------

class ClientBookingActionView(APIView):
    """
    POST /api/transactions/bookings/<id>/client-action/
    Le client confirme la fin des travaux ou annule.
    Body : { action: 'TERMINE' | 'ANNULE' }
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        booking = get_object_or_404(
            Booking,
            id=pk,
            client=request.user,
        )
        action = request.data.get('action')

        # Client peut confirmer fin des travaux ou annuler (avant confirmation)
        if action == 'TERMINE' and booking.status == Booking.Status.EN_COURS:
            booking.status = Booking.Status.TERMINE
            booking.save()
            return Response({'message': 'Travaux confirmés comme terminés.', 'status': 'TERMINE'})

        if action == 'ANNULE' and booking.status == Booking.Status.EN_ATTENTE:
            booking.status = Booking.Status.ANNULE
            booking.save()
            return Response({'message': 'Réservation annulée.', 'status': 'ANNULE'})

        return Response(
            {'error': 'Action non autorisée dans ce statut.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ---------------------------------------------------------------------------
# Suivi des travaux (peintre ajoute des étapes)
# ---------------------------------------------------------------------------

class WorkProgressCreateView(APIView):
    """
    POST /api/transactions/bookings/<id>/progress/
    Le peintre ajoute une étape d'avancement avec photo optionnelle.
    """
    permission_classes = [IsAuthenticated, IsPeintre]

    def post(self, request, pk):
        from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
        booking = get_object_or_404(
            Booking,
            id=pk,
            painter=request.user.painter_profile,
            status=Booking.Status.EN_COURS,
        )

        step_label  = request.data.get('step_label', '').strip()
        description = request.data.get('description', '').strip()
        percentage  = request.data.get('percentage', 0)
        photo       = request.FILES.get('photo', None)

        if not step_label:
            return Response(
                {'error': 'Le titre de l\'étape est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            percentage = max(0, min(100, int(percentage)))
        except (ValueError, TypeError):
            percentage = 0

        from .models import WorkProgress
        progress = WorkProgress.objects.create(
            booking=booking,
            step_label=step_label,
            description=description,
            percentage=percentage,
            photo=photo,
            updated_by=request.user,
        )

        photo_url = None
        if progress.photo:
            try:
                photo_url = request.build_absolute_uri(progress.photo.url)
            except Exception:
                pass

        logger.info(
            f'Avancement ajouté : {step_label} ({percentage}%) '
            f'sur réservation {booking.id}'
        )

        # Notifier le client
        try:
            from apps.notifications.service import notify_work_progress
            notify_work_progress(progress)
        except Exception as e:
            logger.error(f'Notification avancement : {e}')

        return Response({
            'id':          str(progress.id),
            'step_label':  progress.step_label,
            'description': progress.description,
            'percentage':  progress.percentage,
            'photo_url':   photo_url,
            'created_at':  progress.created_at,
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Paiements
# ---------------------------------------------------------------------------

class InitiatePaymentView(APIView):
    """
    POST /api/transactions/bookings/<id>/pay/
    Initie un paiement (acompte ou solde) pour une réservation.

    Body :
        payment_type : 'ACOMPTE' | 'SOLDE'
        method       : 'MTN_MOMO' | 'ORANGE_MONEY' | 'SIMULATION'
        phone        : numéro Mobile Money (format 237XXXXXXXXX)
        percentage   : pourcentage de l'acompte (défaut 30, ignoré pour SOLDE)
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        from .models import Payment, Booking
        from .payment_gateway import get_gateway
        from decimal import Decimal

        booking = get_object_or_404(
            Booking,
            id=pk,
            client=request.user,
        )

        payment_type = request.data.get('payment_type', 'ACOMPTE')
        method       = request.data.get('method', 'SIMULATION')
        phone        = request.data.get('phone', '').strip()
        percentage   = int(request.data.get('percentage', 30))

        # Validation
        if not phone:
            return Response(
                {'error': 'Le numéro de téléphone est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_type not in ['ACOMPTE', 'SOLDE']:
            return Response(
                {'error': 'payment_type doit être ACOMPTE ou SOLDE.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier qu'un paiement du même type n'existe pas déjà
        existing = Payment.objects.filter(
            booking=booking,
            payment_type=payment_type,
            status='TRAITE',
        ).first()
        if existing:
            return Response(
                {'error': f'Un {payment_type.lower()} a déjà été traité pour cette réservation.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calcul du montant
        total = booking.quote.total_amount
        if payment_type == 'ACOMPTE':
            amount = int(total * Decimal(percentage) / 100)
        else:
            # Solde = total - acompte déjà payé
            acompte_paid = Payment.objects.filter(
                booking=booking,
                payment_type='ACOMPTE',
                status='TRAITE',
            ).first()
            if not acompte_paid:
                return Response(
                    {'error': 'L\'acompte doit être payé avant le solde.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            amount = int(total - acompte_paid.amount)

        # Créer l'enregistrement de paiement en attente
        payment = Payment.objects.create(
            booking=booking,
            payment_type=payment_type,
            amount=amount,
            method=method,
            phone_number=phone,
            status='EN_ATTENTE',
        )

        # Appel au gateway
        gateway   = get_gateway(method)
        reference = f'PM-{str(payment.id)[:8].upper()}'

        try:
            result = gateway.initiate_payment(
                amount=amount,
                phone=phone,
                reference=reference,
                description=f'{payment_type} réservation {str(booking.id)[:8]}',
            )

            # Mise à jour du paiement
            payment.status          = result.status
            payment.transaction_ref = result.transaction_ref
            payment.provider        = method
            payment.save()

            # Si acompte payé → confirmer la réservation
            if result.success and payment_type == 'ACOMPTE':
                if booking.status == Booking.Status.EN_ATTENTE:
                    booking.status = Booking.Status.CONFIRME
                    booking.save()

            # Si solde payé → marquer réservation comme terminée + notifier
            if result.success and payment_type == 'SOLDE':
                booking.status = Booking.Status.TERMINE
                booking.save()
                # Notifier le peintre
                try:
                    from apps.notifications.service import create_in_app_notification
                    create_in_app_notification(
                        user=booking.painter.user,
                        notif_type='BOOKING',
                        title='Solde reçu — Prestation terminée',
                        message=f'{booking.client.get_full_name()} a payé le solde. La prestation est officiellement terminée.',
                        link='/painter/works',
                    )
                except Exception as e:
                    logger.error(f'Notification solde : {e}')

            logger.info(
                f'Paiement {payment_type} : {amount} FCFA | '
                f'booking {booking.id} | ref {result.transaction_ref}'
            )

            return Response({
                'success':         result.success,
                'payment_id':      str(payment.id),
                'transaction_ref': result.transaction_ref,
                'amount':          amount,
                'payment_type':    payment_type,
                'status':          result.status,
                'message':         result.message,
                'booking_status':  booking.status,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            payment.status = 'ECHOUE'
            payment.save()
            logger.error(f'Erreur paiement : {e}')
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PaymentHistoryView(generics.ListAPIView):
    """
    GET /api/transactions/bookings/<id>/payments/
    Historique des paiements d'une réservation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from .models import Payment, Booking
        booking = get_object_or_404(Booking, id=pk)

        # Vérification d'accès
        if request.user.role == 'CLIENT' and booking.client != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'PEINTRE' and booking.painter != request.user.painter_profile:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        payments = Payment.objects.filter(booking=booking).order_by('created_at')
        data = [
            {
                'id':              str(p.id),
                'payment_type':    p.payment_type,
                'amount':          str(p.amount),
                'method':          p.get_method_display(),
                'status':          p.status,
                'transaction_ref': p.transaction_ref,
                'created_at':      p.created_at,
            }
            for p in payments
        ]
        return Response({'payments': data, 'total': str(booking.quote.total_amount)})


class ProgressReactionView(APIView):
    """
    POST /api/transactions/progress/<id>/react/
    Le client ou le peintre réagit à une étape de travaux.
    Peut inclure un commentaire et/ou une photo.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from .models import WorkProgress, ProgressReaction
        progress = get_object_or_404(WorkProgress, id=pk)
        booking  = progress.booking

        # Vérifier l'accès
        user = request.user
        if user.role == 'CLIENT' and booking.client != user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'PEINTRE' and booking.painter != user.painter_profile:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        comment = request.data.get('comment', '').strip()
        photo   = request.FILES.get('photo', None)

        if not comment and not photo:
            return Response(
                {'error': 'Un commentaire ou une photo est requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reaction = ProgressReaction.objects.create(
            progress=progress,
            author=user,
            comment=comment,
            photo=photo,
        )

        photo_url = None
        if reaction.photo:
            try:
                photo_url = request.build_absolute_uri(reaction.photo.url)
            except Exception:
                pass

        return Response({
            'id':         str(reaction.id),
            'author':     user.get_full_name(),
            'comment':    reaction.comment,
            'photo_url':  photo_url,
            'created_at': reaction.created_at,
        }, status=status.HTTP_201_CREATED)
