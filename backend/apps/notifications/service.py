"""
PaintMatch — Service de notifications email.

Envoie des emails HTML pour chaque événement important de la plateforme.
Utilise le backend SMTP configuré dans settings (Gmail en dev, SMTP en prod).
"""

import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger('paintmatch')


def send_notification(to_email, subject, template_name, context):
    """
    Envoie un email HTML à partir d'un template.
    En cas d'erreur, log l'erreur sans bloquer l'application.
    """
    try:
        html_message  = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f'Email envoyé à {to_email} : {subject}')
        return True
    except Exception as e:
        logger.error(f'Erreur envoi email à {to_email} : {e}')
        return False


def create_in_app_notification(user, notif_type, title, message, link=''):
    """
    Crée une notification in-app stockée en base.
    Appelée en plus de l'email pour chaque événement.
    """
    try:
        from .models import Notification
        Notification.objects.create(
            recipient=user,
            notif_type=notif_type,
            title=title,
            message=message,
            link=link,
        )
    except Exception as e:
        logger.error(f'Erreur création notification in-app : {e}')


# ---------------------------------------------------------------------------
# Fonctions de notification par événement
# ---------------------------------------------------------------------------

def notify_new_quote_request(quote_request):
    """Notifie le peintre d'une nouvelle demande de devis."""
    painter = quote_request.painter
    create_in_app_notification(
        user=painter.user,
        notif_type='QUOTE_REQUEST',
        title='Nouvelle demande de devis',
        message=f'{quote_request.client.get_full_name()} vous a envoyé une demande pour : {quote_request.title}',
        link='/painter/quotes',
    )
    send_notification(
        to_email=painter.user.email,
        subject=f'PaintMatch — Nouvelle demande de devis de {quote_request.client.get_full_name()}',
        template_name='notifications/new_quote_request.html',
        context={
            'painter_name': painter.user.get_full_name(),
            'client_name':  quote_request.client.get_full_name(),
            'title':        quote_request.title,
            'location':     quote_request.location,
            'description':  quote_request.description,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_quote_sent(quote):
    """Notifie le client qu'il a reçu un devis."""
    client = quote.request.client
    create_in_app_notification(
        user=client,
        notif_type='QUOTE_SENT',
        title='Vous avez reçu un devis',
        message=f'{quote.painter.user.get_full_name()} vous a envoyé un devis de {quote.total_amount} FCFA',
        link='/client/quotes',
    )
    send_notification(
        to_email=client.email,
        subject=f'PaintMatch — {quote.painter.user.get_full_name()} vous a envoyé un devis',
        template_name='notifications/quote_sent.html',
        context={
            'client_name':  client.get_full_name(),
            'painter_name': quote.painter.user.get_full_name(),
            'title':        quote.request.title,
            'amount':       quote.total_amount,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_quote_accepted(quote):
    """Notifie le peintre que son devis a été accepté."""
    create_in_app_notification(
        user=quote.painter.user,
        notif_type='QUOTE_ACCEPTED',
        title='Devis accepté !',
        message=f'{quote.request.client.get_full_name()} a accepté votre devis de {quote.total_amount} FCFA',
        link='/painter/works',
    )
    send_notification(
        to_email=quote.painter.user.email,
        subject=f'PaintMatch — Votre devis a été accepté par {quote.request.client.get_full_name()} !',
        template_name='notifications/quote_accepted.html',
        context={
            'painter_name': quote.painter.user.get_full_name(),
            'client_name':  quote.request.client.get_full_name(),
            'title':        quote.request.title,
            'amount':       quote.total_amount,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_quote_refused(quote):
    """Notifie le peintre que son devis a été refusé."""
    create_in_app_notification(
        user=quote.painter.user,
        notif_type='QUOTE_REFUSED',
        title='Devis refusé',
        message=f'{quote.request.client.get_full_name()} a refusé votre devis',
        link='/painter/quotes',
    )
    send_notification(
        to_email=quote.painter.user.email,
        subject=f'PaintMatch — Votre devis a été refusé',
        template_name='notifications/quote_refused.html',
        context={
            'painter_name': quote.painter.user.get_full_name(),
            'client_name':  quote.request.client.get_full_name(),
            'title':        quote.request.title,
            'note':         quote.client_note,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_booking_confirmed(booking):
    """Notifie le client et le peintre que la réservation est confirmée."""
    # Client
    send_notification(
        to_email=booking.client.email,
        subject='PaintMatch — Votre réservation est confirmée !',
        template_name='notifications/booking_confirmed_client.html',
        context={
            'client_name':  booking.client.get_full_name(),
            'painter_name': booking.painter.user.get_full_name(),
            'amount':       booking.quote.total_amount,
            'app_url':      'http://localhost:3000',
        }
    )
    # Peintre
    send_notification(
        to_email=booking.painter.user.email,
        subject=f'PaintMatch — Nouvelle réservation confirmée avec {booking.client.get_full_name()}',
        template_name='notifications/booking_confirmed_painter.html',
        context={
            'painter_name': booking.painter.user.get_full_name(),
            'client_name':  booking.client.get_full_name(),
            'amount':       booking.quote.total_amount,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_work_progress(progress):
    """Notifie le client d'une nouvelle étape des travaux."""
    booking = progress.booking
    create_in_app_notification(
        user=booking.client,
        notif_type='WORK_PROGRESS',
        title=f'Avancement : {progress.step_label}',
        message=f'{booking.painter.user.get_full_name()} a mis à jour vos travaux — {progress.percentage}%',
        link='/client/bookings',
    )
    send_notification(
        to_email=booking.client.email,
        subject=f'PaintMatch — Mise à jour de vos travaux : {progress.step_label}',
        template_name='notifications/work_progress.html',
        context={
            'client_name':  booking.client.get_full_name(),
            'painter_name': booking.painter.user.get_full_name(),
            'step_label':   progress.step_label,
            'description':  progress.description,
            'percentage':   progress.percentage,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_work_finished(booking):
    """Notifie le client que les travaux sont terminés."""
    create_in_app_notification(
        user=booking.client,
        notif_type='WORK_FINISHED',
        title='Travaux terminés !',
        message=f'{booking.painter.user.get_full_name()} a déclaré vos travaux terminés. Confirmez et évaluez !',
        link='/client/bookings',
    )
    send_notification(
        to_email=booking.client.email,
        subject='PaintMatch — Vos travaux sont terminés !',
        template_name='notifications/work_finished.html',
        context={
            'client_name':  booking.client.get_full_name(),
            'painter_name': booking.painter.user.get_full_name(),
            'app_url':      'http://localhost:3000',
        }
    )


def notify_new_review(review):
    """Notifie le peintre d'une nouvelle évaluation."""
    create_in_app_notification(
        user=review.painter.user,
        notif_type='NEW_REVIEW',
        title='Nouvelle évaluation reçue',
        message=f'{review.client.get_full_name()} vous a noté {"★" * review.rating}',
        link='/painter/reviews',
    )
    send_notification(
        to_email=review.painter.user.email,
        subject=f'PaintMatch — {review.client.get_full_name()} vous a laissé un avis',
        template_name='notifications/new_review.html',
        context={
            'painter_name': review.painter.user.get_full_name(),
            'client_name':  review.client.get_full_name(),
            'rating':       review.rating,
            'stars':        '★' * review.rating + '☆' * (5 - review.rating),
            'comment':      review.comment,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_painter_validated(painter_profile):
    """Notifie le peintre que son profil a été validé."""
    create_in_app_notification(
        user=painter_profile.user,
        notif_type='PROFILE',
        title='Profil validé !',
        message='Félicitations ! Votre profil est maintenant visible sur la plateforme.',
        link='/painter/profile',
    )
    send_notification(
        to_email=painter_profile.user.email,
        subject='PaintMatch — Félicitations, votre profil est validé !',
        template_name='notifications/painter_validated.html',
        context={
            'painter_name': painter_profile.user.get_full_name(),
            'app_url':      'http://localhost:3000',
        }
    )


def notify_painter_refused(painter_profile, note=''):
    """Notifie le peintre que son profil a été refusé."""
    create_in_app_notification(
        user=painter_profile.user,
        notif_type='PROFILE',
        title='Profil non validé',
        message='Votre profil n\'a pas été validé. Consultez les détails et corrigez les informations.',
        link='/painter/profile',
    )
    send_notification(
        to_email=painter_profile.user.email,
        subject='PaintMatch — Votre profil n\'a pas été validé',
        template_name='notifications/painter_refused.html',
        context={
            'painter_name': painter_profile.user.get_full_name(),
            'note':         note,
            'app_url':      'http://localhost:3000',
        }
    )


def notify_new_message(message):
    """Notifie le destinataire d'un nouveau message."""
    conversation = message.conversation
    sender       = message.sender

    if sender == conversation.client:
        recipient = conversation.painter.user
    else:
        recipient = conversation.client

    create_in_app_notification(
        user=recipient,
        notif_type='MESSAGE',
        title=f'Message de {sender.get_full_name()}',
        message=message.content[:80] + ('...' if len(message.content) > 80 else ''),
        link='/messages',
    )
    send_notification(
        to_email=recipient.email,
        subject=f'PaintMatch — Nouveau message de {sender.get_full_name()}',
        template_name='notifications/new_message.html',
        context={
            'recipient_name': recipient.get_full_name(),
            'sender_name':    sender.get_full_name(),
            'preview':        message.content[:100] + ('...' if len(message.content) > 100 else ''),
            'app_url':        'http://localhost:3000',
        }
    )
