"""
PaintMatch — Vues de l'application administration.

Tous les endpoints sont protégés par IsAdminUser.
"""

import logging
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from apps.accounts.models import User, PainterProfile, ValidationStatus, UserRole
from apps.accounts.permissions import IsAdminUser
from .models import AdminLog, PlatformSettings
from .serializers import (
    AdminPainterListSerializer,
    AdminPainterDossierSerializer,
    ValidationActionSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    PlatformStatsSerializer,
    AdminLogSerializer,
    PlatformSettingsSerializer,
)

logger = logging.getLogger('paintmatch')


def log_admin_action(admin_user, action, target_model='', target_id='', target_label='', note=''):
    AdminLog.objects.create(
        admin=admin_user,
        action=action,
        target_model=target_model,
        target_id=str(target_id),
        target_label=target_label,
        note=note,
    )


# ---------------------------------------------------------------------------
# Sitemap XML (public)
# ---------------------------------------------------------------------------

class SitemapView(APIView):
    """GET /api/sitemap.xml — Sitemap dynamique pour les peintres validés."""
    permission_classes = [AllowAny]

    def get(self, request):
        base_url = 'https://paintmatch.cm'
        painters = PainterProfile.objects.filter(
            validation_status=ValidationStatus.VALIDE,
            user__is_active=True,
        ).values_list('id', flat=True)

        urls = [
            f'<url><loc>{base_url}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>',
            f'<url><loc>{base_url}/painters</loc><changefreq>daily</changefreq><priority>0.9</priority></url>',
            f'<url><loc>{base_url}/how-it-works</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>',
        ]
        for painter_id in painters:
            urls.append(
                f'<url><loc>{base_url}/painters/{painter_id}</loc>'
                f'<changefreq>weekly</changefreq><priority>0.8</priority></url>'
            )

        sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{"".join(urls)}
</urlset>'''

        return HttpResponse(sitemap, content_type='application/xml')


# ---------------------------------------------------------------------------
# Gestion des peintres
# ---------------------------------------------------------------------------

class AdminPainterListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = AdminPainterListSerializer

    def get_queryset(self):
        qs = PainterProfile.objects.select_related('user').prefetch_related(
            'professional_docs', 'painter_skills'
        ).order_by('-user__date_joined')

        status_filter = self.request.query_params.get('validation_status')
        if status_filter:
            qs = qs.filter(validation_status=status_filter)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)  |
                Q(user__email__icontains=search)      |
                Q(user__city__icontains=search)
            )
        return qs


class AdminPainterDossierView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = AdminPainterDossierSerializer
    queryset           = PainterProfile.objects.select_related('user').prefetch_related(
        'professional_docs', 'painter_skills__skill',
        'qualifications', 'portfolio_items',
    )


class AdminValidatePainterView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        painter = get_object_or_404(PainterProfile, pk=pk)
        serializer = ValidationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        note   = serializer.validated_data.get('note', '')

        painter.validation_status = action
        painter.validation_note   = note
        painter.validated_by      = request.user

        if action == ValidationStatus.VALIDE:
            painter.validation_date = timezone.now()

        painter.save()

        action_map = {
            'VALIDE':     AdminLog.ActionType.VALIDATE_PAINTER,
            'REFUSE':     AdminLog.ActionType.REFUSE_PAINTER,
            'SUSPENDU':   AdminLog.ActionType.SUSPEND_PAINTER,
            'COMPLEMENT': AdminLog.ActionType.REQUEST_COMPLEMENT,
        }
        log_admin_action(
            admin_user   = request.user,
            action       = action_map.get(action, AdminLog.ActionType.OTHER),
            target_model = 'PainterProfile',
            target_id    = painter.id,
            target_label = painter.user.get_full_name(),
            note         = note,
        )

        logger.info(f'[ADMIN] {request.user.email} → {action} peintre {painter.user.email} | note: {note}')

        # Notifications
        try:
            from apps.notifications.service import notify_painter_validated, notify_painter_refused
            if action == 'VALIDE':
                notify_painter_validated(painter)
            elif action in ('REFUSE', 'COMPLEMENT'):
                notify_painter_refused(painter, note)
        except Exception as e:
            logger.error(f'Notification validation peintre : {e}')

        return Response({
            'message': f'Statut mis à jour : {action}',
            'validation_status': action,
            'painter_id': painter.id,
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Gestion des utilisateurs
# ---------------------------------------------------------------------------

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.order_by('-date_joined')
        role_filter = self.request.query_params.get('role')
        if role_filter:
            qs = qs.filter(role=role_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(email__icontains=search)      |
                Q(city__icontains=search)
            )
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset           = User.objects.all()
    http_method_names  = ['get', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return AdminUserUpdateSerializer
        return AdminUserSerializer


class AdminToggleUserActiveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response(
                {'error': 'Vous ne pouvez pas désactiver votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = not user.is_active
        user.save()
        action = AdminLog.ActionType.ACTIVATE_USER if user.is_active else AdminLog.ActionType.DEACTIVATE_USER
        log_admin_action(request.user, action, 'User', user.id, user.get_full_name())
        return Response({'message': f'Compte {"activé" if user.is_active else "désactivé"}.', 'is_active': user.is_active})


# ---------------------------------------------------------------------------
# Statistiques
# ---------------------------------------------------------------------------

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        stats = {
            'clients_count':      User.objects.filter(role=UserRole.CLIENT, is_active=True).count(),
            'painters_total':     PainterProfile.objects.count(),
            'painters_validated': PainterProfile.objects.filter(validation_status=ValidationStatus.VALIDE).count(),
            'painters_pending':   PainterProfile.objects.filter(validation_status=ValidationStatus.EN_ATTENTE).count(),
            'quotes_count':       0,
            'reviews_count':      0,
        }
        try:
            from apps.transactions.models import Quote
            stats['quotes_count'] = Quote.objects.filter(status='ENVOYE').count()
        except Exception:
            pass
        try:
            from apps.reviews.models import Review
            stats['reviews_count'] = Review.objects.count()
        except Exception:
            pass

        serializer = PlatformStatsSerializer(stats)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Journal admin
# ---------------------------------------------------------------------------

class AdminLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = AdminLogSerializer
    queryset           = AdminLog.objects.select_related('admin').order_by('-timestamp')


# ---------------------------------------------------------------------------
# Paramètres
# ---------------------------------------------------------------------------

class PlatformSettingsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = PlatformSettingsSerializer
    queryset           = PlatformSettings.objects.all()


class PlatformSettingsDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class   = PlatformSettingsSerializer
    queryset           = PlatformSettings.objects.all()
    http_method_names  = ['get', 'patch', 'head', 'options']
