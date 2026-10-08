"""
Valide immédiatement le peintre de test.
Utilisation : py validate_test_painter.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paintmatch.settings.dev')
django.setup()

from django.utils import timezone
from apps.accounts.models import PainterProfile, ValidationStatus

painters = PainterProfile.objects.select_related('user').all()

print('\n=== VALIDATION DES PEINTRES DE TEST ===\n')

for p in painters:
    if p.validation_status != ValidationStatus.VALIDE:
        p.validation_status = ValidationStatus.VALIDE
        p.validation_date   = timezone.now()
        p.save()
        print(f'[OK] Validé : {p.user.get_full_name()} ({p.user.email}) — ville: {p.user.city}')
    else:
        print(f'[SKIP] Déjà validé : {p.user.get_full_name()} ({p.user.email})')

print(f'\nTotal peintres validés : {PainterProfile.objects.filter(validation_status=ValidationStatus.VALIDE).count()}')
print()
