"""
PaintMatch — Création des utilisateurs de test pour les 3 rôles.
Utilisation : py setup_test_users.py
Ce script est idempotent — il ne recrée pas les utilisateurs existants.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paintmatch.settings.dev')
django.setup()

from apps.accounts.models import User, UserRole, PainterProfile

USERS = [
    {
        'email': 'client@paintmatch.cm',
        'password': 'Client2024',
        'first_name': 'Marie',
        'last_name': 'Fouda',
        'phone': '+237691000001',
        'city': 'Douala',
        'role': UserRole.CLIENT,
    },
    {
        'email': 'peintre@paintmatch.cm',
        'password': 'Peintre2024',
        'first_name': 'Paul',
        'last_name': 'Essomba',
        'phone': '+237691000002',
        'city': 'Yaoundé',
        'role': UserRole.PEINTRE,
    },
]

print('\n=== CRÉATION DES UTILISATEURS DE TEST ===\n')

for u in USERS:
    if User.objects.filter(email=u['email']).exists():
        user = User.objects.get(email=u['email'])
        # Met à jour le mot de passe au cas où
        user.set_password(u['password'])
        user.save()
        print(f'[SKIP] {u["role"]} existe déjà : {u["email"]}')
        continue

    user = User.objects.create_user(
        email=u['email'],
        password=u['password'],
        first_name=u['first_name'],
        last_name=u['last_name'],
        phone=u['phone'],
        city=u['city'],
        role=u['role'],
    )
    print(f'[OK] {u["role"]} créé : {user.email}')

    # Pour le peintre, renseigner une bio de base et VALIDER le profil
    if u['role'] == UserRole.PEINTRE:
        try:
            from django.utils import timezone
            from apps.accounts.models import ValidationStatus
            profile = user.painter_profile
            profile.bio = 'Peintre en bâtiment avec 5 ans d\'expérience à Yaoundé.'
            profile.years_experience = 5
            profile.validation_status = ValidationStatus.VALIDE
            profile.validation_date = timezone.now()
            profile.save()
            print(f'     [OK] PainterProfile initialisé et VALIDÉ')
        except Exception as e:
            print(f'     [WARN] PainterProfile : {e}')

print('\n' + '='*50)
print('\nCOMPTES DISPONIBLES POUR LES TESTS :\n')
print(f'  ADMIN   → nathaliemanga594@gmail.com  / daniels1234')
print(f'  CLIENT  → client@paintmatch.cm        / Client2024')
print(f'  PEINTRE → peintre@paintmatch.cm       / Peintre2024')
print()
