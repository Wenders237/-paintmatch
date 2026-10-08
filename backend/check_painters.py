"""
Diagnostic — vérifie l'état des peintres en base.
Utilisation : py check_painters.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paintmatch.settings.dev')
django.setup()

from apps.accounts.models import PainterProfile

painters = PainterProfile.objects.select_related('user').all()
print(f'\n=== PEINTRES EN BASE ({painters.count()}) ===\n')

for p in painters:
    print(f'  Email    : {p.user.email}')
    print(f'  Nom      : {p.user.get_full_name()}')
    print(f'  Ville    : {p.user.city}')
    print(f'  Statut   : {p.validation_status}')
    print(f'  Actif    : {p.user.is_active}')
    print()

from apps.accounts.models import ValidationStatus
valides = painters.filter(validation_status=ValidationStatus.VALIDE, user__is_active=True)
print(f'Peintres VALIDES et actifs : {valides.count()}')
print()
