# PaintMatch

Plateforme intelligente de mise en relation entre clients et peintres en bâtiment au Cameroun.

## Stack technique

- **Backend** : Python 3.14 · Django 5 · Django REST Framework · JWT
- **Frontend** : React 18 · Vite · Tailwind CSS · React Router v6
- **Base de données** : SQLite (développement) → PostgreSQL (production)
- **Authentification** : JWT via `djangorestframework-simplejwt`
- **i18n** : Français + Anglais (django-i18n + react-i18next)

---

## Installation — Backend

```bash
cd backend

# 1. Créer et activer l'environnement virtuel
py -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer les variables d'environnement
copy .env.example .env
# Éditer .env selon vos besoins

# 4. Appliquer les migrations
py manage.py migrate

# 5. Créer un super-utilisateur admin
py manage.py createsuperuser

# 6. Lancer le serveur de développement
py manage.py runserver
```

Le backend est accessible sur : http://localhost:8000
Documentation API (Swagger) : http://localhost:8000/api/docs/

---

## Installation — Frontend

```bash
cd frontend

# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
copy .env.example .env

# 3. Lancer le serveur de développement
npm run dev
```

Le frontend est accessible sur : http://localhost:3000

---

## Structure du projet

```
paintmatch/
├── backend/
│   ├── apps/
│   │   ├── accounts/        # Utilisateurs, profils, authentification
│   │   ├── services/        # Catégories, compétences, qualifications
│   │   ├── marketplace/     # Recherche, recommandation IA, disponibilités
│   │   ├── transactions/    # Devis, réservations, paiements, travaux
│   │   ├── reviews/         # Évaluations
│   │   ├── messaging/       # Messagerie directe
│   │   ├── notifications/   # Notifications in-app + e-mail
│   │   └── administration/  # Validation peintres, statistiques
│   ├── paintmatch/
│   │   ├── settings/
│   │   │   ├── base.py      # Config commune
│   │   │   ├── dev.py       # Config développement
│   │   │   └── prod.py      # Config production
│   │   └── urls.py
│   ├── requirements.txt
│   └── manage.py
│
└── frontend/
    ├── src/
    │   ├── components/      # Composants réutilisables
    │   ├── layouts/         # Layouts (Public, Auth, Dashboard)
    │   ├── pages/           # Pages par rôle
    │   ├── services/        # Appels API (Axios)
    │   ├── store/           # État global (Zustand)
    │   ├── locales/         # Traductions FR/EN
    │   └── styles/          # CSS global (Tailwind)
    └── package.json
```

---

## Endpoints API disponibles (Phase 1)

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/register/` | Inscription |
| POST | `/api/auth/login/` | Connexion JWT |
| POST | `/api/auth/logout/` | Déconnexion |
| POST | `/api/auth/token/refresh/` | Renouvellement token |
| GET/PATCH | `/api/auth/me/` | Profil utilisateur connecté |
| POST | `/api/auth/change-password/` | Changer son mot de passe |
| GET/PATCH | `/api/profiles/client/me/` | Profil client |
| GET/PATCH | `/api/profiles/painter/me/` | Profil peintre |

---

## Phases de développement

- [x] Phase 1 — Setup, authentification, profils de base
- [ ] Phase 2 — Profils complets, compétences, portfolio, documents
- [ ] Phase 3 — Validation administrative, back-office
- [ ] Phase 4 — Recherche et consultation profils publics
- [ ] Phase 5 — Messagerie directe + demandes de devis
- [ ] Phase 6 — Réservation et suivi des travaux
- [ ] Phase 7 — Module de paiement (MTN + Orange Money)
- [ ] Phase 8 — Évaluations
- [ ] Phase 9 — Système intelligent (recommandation + assistance devis)
- [ ] Phase 10 — Notifications in-app + e-mail
- [ ] Phase 11 — SEO, performance, audit sécurité
