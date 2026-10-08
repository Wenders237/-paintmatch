"""
PaintMatch — Signaux pour l'application accounts.

Responsabilités :
- Créer automatiquement ClientProfile ou PainterProfile après la création d'un User.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, ClientProfile, PainterProfile, UserRole


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crée automatiquement le profil associé (client ou peintre)
    lors de la création d'un nouvel utilisateur.
    """
    if not created:
        return

    if instance.role == UserRole.CLIENT:
        ClientProfile.objects.get_or_create(user=instance)

    elif instance.role == UserRole.PEINTRE:
        PainterProfile.objects.get_or_create(user=instance)
