# PaintMatch — Guide Complet du Projet
## Documentation technique et fonctionnelle

---

## TABLE DES MATIÈRES

1. [Présentation du projet](#1-présentation-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Installation et démarrage](#3-installation-et-démarrage)
4. [Architecture du projet](#4-architecture-du-projet)
5. [Les acteurs et leurs rôles](#5-les-acteurs-et-leurs-rôles)
6. [Phases de développement](#6-phases-de-développement)
7. [Base de données](#7-base-de-données)
8. [API Backend](#8-api-backend)
9. [Frontend React](#9-frontend-react)
10. [Système de paiement](#10-système-de-paiement)
11. [Notifications](#11-notifications)
12. [Système intelligent](#12-système-intelligent)
13. [Sécurité](#13-sécurité)
14. [Comptes de test](#14-comptes-de-test)
15. [Déploiement en production](#15-déploiement-en-production)

---

## 1. PRÉSENTATION DU PROJET

**PaintMatch** est une plateforme web intelligente de mise en relation entre des **clients** recherchant des prestations de peinture en bâtiment et des **peintres qualifiés** vérifiés au Cameroun.

### Objectif principal
Permettre à un client de :
1. Trouver un peintre qualifié dans sa ville
2. Demander un devis gratuit
3. Accepter le devis et réserver
4. Payer via Mobile Money
5. Suivre les travaux en temps réel
6. Évaluer la prestation

### Fonctionnalités clés
- Recherche intelligente de peintres par ville et compétences
- Système de recommandation IA (scoring pondéré)
- Gestion complète des devis avec assistance IA
- Paiement en deux temps : acompte + solde (MTN MoMo / Orange Money)
- Suivi des travaux avec photos à chaque étape
- Messagerie directe client ↔ peintre
- Système d'évaluations avec réponses
- Notifications email + in-app en temps réel
- Back-office administrateur complet

---

## 2. STACK TECHNIQUE

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 18.3.1 | Interface utilisateur |
| Vite | 5.3.4 | Outil de build (remplace CRA) |
| React Router v6 | 6.24.1 | Navigation SPA |
| Tailwind CSS | 3.4.6 | Styles utilitaires |
| Zustand | 4.5.4 | État global (auth) |
| TanStack React Query | 5.51.1 | Gestion des appels API |
| Axios | 1.7.2 | Client HTTP |
| React Hook Form | 7.52.1 | Formulaires |
| react-i18next | 14.1.3 | Internationalisation FR/EN |
| lucide-react | 0.400.0 | Icônes |
| react-hot-toast | 2.4.1 | Notifications UI |
| date-fns | 3.6.0 | Manipulation des dates |

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| Python | 3.14.3 | Langage backend |
| Django | 5.0.6 | Framework web |
| Django REST Framework | 3.15.2 | API REST |
| djangorestframework-simplejwt | 5.3.1 | Authentification JWT |
| django-cors-headers | 4.4.0 | Gestion CORS |
| django-environ | 0.11.2 | Variables d'environnement |
| django-filter | 24.2 | Filtres API |
| drf-spectacular | 0.27.2 | Documentation Swagger |

### Base de données
- **Développement** : SQLite (intégré Django)
- **Production** : PostgreSQL (migration prévue)

---

## 3. INSTALLATION ET DÉMARRAGE

### Prérequis
- Python 3.14+
- Node.js 18+
- npm 9+

### Démarrage rapide (après redémarrage PC)

Ouvrir PowerShell dans le dossier racine et taper :

```powershell
cd "d:\mes projets\mises en relation clients peintre"
.\start.ps1
```

Deux fenêtres s'ouvrent automatiquement. Attendre 15 secondes puis ouvrir :
- **Application** → http://localhost:3000
- **API docs** → http://127.0.0.1:8000/api/docs/
- **Admin Django** → http://127.0.0.1:8000/admin/

### Installation manuelle (première fois)

#### Backend
```powershell
cd "d:\mes projets\mises en relation clients peintre\backend"
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py manage.py makemigrations
py manage.py migrate
py setup_test_users.py
py manage.py runserver
```

#### Frontend
```powershell
cd "d:\mes projets\mises en relation clients peintre\frontend"
npm install
npm run dev
```

---

## 4. ARCHITECTURE DU PROJET

```
mises en relation clients peintre/
├── backend/                    ← Serveur Django
│   ├── apps/
│   │   ├── accounts/           ← Utilisateurs, authentification, profils
│   │   ├── services/           ← Compétences, qualifications, portfolio
│   │   ├── marketplace/        ← Recherche, disponibilités, moteur IA
│   │   ├── transactions/       ← Devis, réservations, paiements, travaux
│   │   ├── reviews/            ← Évaluations
│   │   ├── messaging/          ← Messagerie directe
│   │   ├── notifications/      ← Notifications in-app + email
│   │   └── administration/     ← Back-office admin, statistiques
│   ├── paintmatch/
│   │   ├── settings/
│   │   │   ├── base.py         ← Configuration commune
│   │   │   ├── dev.py          ← Configuration développement
│   │   │   └── prod.py         ← Configuration production
│   │   └── urls.py             ← URLs racine
│   ├── templates/
│   │   └── notifications/      ← Templates HTML des emails
│   ├── requirements.txt
│   ├── manage.py
│   └── .env                    ← Variables d'environnement
│
├── frontend/                   ← Application React
│   ├── src/
│   │   ├── assets/             ← Images et ressources
│   │   ├── components/
│   │   │   ├── booking/        ← Composants réservations
│   │   │   ├── common/         ← Composants réutilisables
│   │   │   ├── navigation/     ← Navbar, Footer, Sidebar
│   │   │   └── painter/        ← Composants profil peintre
│   │   ├── layouts/            ← Layouts (Public, Auth, Dashboard)
│   │   ├── locales/            ← Traductions FR/EN
│   │   ├── pages/
│   │   │   ├── admin/          ← Pages back-office
│   │   │   ├── auth/           ← Connexion, inscription
│   │   │   ├── client/         ← Espace client
│   │   │   ├── dashboard/      ← Tableaux de bord
│   │   │   ├── painter/        ← Espace peintre
│   │   │   └── public/         ← Pages publiques
│   │   ├── services/           ← Appels API (Axios)
│   │   ├── store/              ← État global (Zustand)
│   │   └── styles/             ← CSS global (Tailwind)
│   ├── public/
│   │   └── robots.txt
│   └── package.json
│
├── docs/                       ← Documentation
├── start.ps1                   ← Script de démarrage
└── README.md
```

---

## 5. LES ACTEURS ET LEURS RÔLES

### VISITEUR (non connecté)
- Consulter la page d'accueil
- Rechercher des peintres par ville
- Consulter les profils publics des peintres
- S'inscrire

### CLIENT
- Rechercher et filtrer les peintres
- Envoyer des demandes de devis
- Accepter ou refuser les devis
- Payer l'acompte et le solde
- Suivre l'avancement des travaux avec photos
- Confirmer la fin des travaux
- Évaluer le peintre
- Utiliser la messagerie directe

### PEINTRE
- Compléter son profil professionnel (compétences, portfolio, documents)
- Attendre la validation de l'administrateur
- Recevoir des demandes de devis
- Rédiger des devis (avec assistance IA)
- Confirmer les réservations
- Mettre à jour l'avancement des travaux avec photos
- Déclarer les travaux terminés
- Répondre aux évaluations

> ⚠️ **Important** : Un peintre non validé par l'administrateur n'est PAS visible sur la plateforme et ne peut pas recevoir de devis.

### ADMINISTRATEUR
- Valider ou refuser les profils peintres
- Gérer les utilisateurs (activer/désactiver)
- Consulter les statistiques globales
- Accéder au journal des actions

---

## 6. PHASES DE DÉVELOPPEMENT

| Phase | Contenu | Statut |
|---|---|---|
| **Phase 1** | Setup Django + React, JWT, 3 rôles, inscription/connexion | ✅ Terminée |
| **Phase 2** | Profils peintres complets (compétences, portfolio, documents, disponibilités) | ✅ Terminée |
| **Phase 3** | Validation administrative des peintres, gestion utilisateurs | ✅ Terminée |
| **Phase 4** | Recherche de peintres + système de recommandation IA | ✅ Terminée |
| **Phase 5** | Messagerie directe + système de devis complet + assistance IA | ✅ Terminée |
| **Phase 6** | Réservations + suivi des travaux avec photos + réactions | ✅ Terminée |
| **Phase 7** | Module de paiement MTN Mobile Money + Orange Money | ✅ Terminée |
| **Phase 8** | Système d'évaluations avec réponses peintres | ✅ Terminée |
| **Phase 9** | Notifications email (Gmail) + notifications in-app avec badge | ✅ Terminée |
| **Phase 10** | SEO, performance, sécurité, design amélioré | ✅ Terminée |

---

## 7. BASE DE DONNÉES

### Modèles principaux

#### accounts — Utilisateurs
```
User
├── id (UUID)
├── email (identifiant de connexion)
├── first_name, last_name
├── phone, city, address
├── role : CLIENT | PEINTRE | ADMIN
├── is_active, email_verified
└── avatar (fichier)

ClientProfile → OneToOne(User)
└── preferences (JSON)

PainterProfile → OneToOne(User)
├── bio, years_experience, professional_id
├── validation_status : EN_ATTENTE | VALIDE | REFUSE | SUSPENDU | COMPLEMENT
├── average_rating, total_reviews
└── is_featured
```

#### services — Compétences et portfolio
```
ServiceCategory → name, slug, description
Skill → name, category
PainterSkill → painter, skill, level (DEBUTANT|CONFIRME|EXPERT)
Qualification → painter, title, issuing_body, date_obtained
ProfessionalDoc → painter, doc_type, file
Portfolio → painter, title, description, category
PortfolioImage → portfolio, image, is_cover
ServiceOffer → painter, category, price_range_min, price_range_max
```

#### marketplace — Recherche
```
Availability → painter, date_start, date_end, is_available
SearchLog → user, city, category, results_count
```

#### transactions — Cycle complet
```
QuoteRequest → client, painter, title, description, location, surface_m2
Quote → request, painter, total_amount, status (BROUILLON|ENVOYE|ACCEPTE|REFUSE)
QuoteItem → quote, description, quantity, unit, unit_price
Booking → quote, client, painter, status (EN_ATTENTE|CONFIRME|EN_COURS|TERMINE)
WorkProgress → booking, step_label, percentage, photo
ProgressReaction → progress, author, comment, photo
Payment → booking, payment_type (ACOMPTE|SOLDE), amount, method, status
```

#### reviews — Évaluations
```
Review → booking, client, painter, rating (1-5), comment, painter_reply
```

#### messaging — Messagerie
```
Conversation → client, painter (unique par paire)
Message → conversation, sender, content, is_read
```

#### notifications — Notifications
```
Notification → recipient, notif_type, title, message, link, is_read
```

---

## 8. API BACKEND

### Endpoints principaux

#### Authentification (/api/auth/)
| Méthode | URL | Description | Accès |
|---|---|---|---|
| POST | /register/ | Inscription | Public |
| POST | /login/ | Connexion JWT | Public |
| POST | /logout/ | Déconnexion | Connecté |
| POST | /token/refresh/ | Refresh token | – |
| GET/PATCH | /me/ | Mon profil | Connecté |
| POST | /change-password/ | Changer mot de passe | Connecté |

#### Services (/api/services/)
| Méthode | URL | Description |
|---|---|---|
| GET | /categories/ | Liste des catégories |
| GET | /skills/ | Liste des compétences |
| GET/POST | /my/skills/ | Mes compétences (peintre) |
| GET/POST | /my/qualifications/ | Mes qualifications |
| GET/POST | /my/documents/ | Mes documents |
| GET/POST | /my/portfolio/ | Mon portfolio |
| GET/POST | /my/offers/ | Mes offres |

#### Marketplace (/api/marketplace/)
| Méthode | URL | Description |
|---|---|---|
| GET | /search/ | Recherche + recommandation |
| GET/POST | /my/availabilities/ | Mes disponibilités |

#### Transactions (/api/transactions/)
| Méthode | URL | Description |
|---|---|---|
| POST | /quote-requests/ | Créer une demande de devis |
| GET | /quote-requests/painter/ | Demandes reçues (peintre) |
| POST | /quotes/ | Créer un devis |
| POST | /quotes/{id}/send/ | Envoyer le devis |
| POST | /quotes/{id}/respond/ | Accepter/refuser |
| GET | /bookings/client/ | Mes réservations (client) |
| GET | /bookings/painter/ | Mes réservations (peintre) |
| POST | /bookings/{id}/action/ | Action peintre |
| POST | /bookings/{id}/progress/ | Ajouter étape travaux |
| POST | /bookings/{id}/pay/ | Initier paiement |
| POST | /ai-assist/ | Assistance IA devis |

#### Reviews (/api/reviews/)
| Méthode | URL | Description |
|---|---|---|
| POST | / | Créer une évaluation |
| GET | /my/ | Mes évaluations données |
| GET | /painter/me/ | Mes évaluations reçues |
| GET | /painter/{id}/ | Évaluations publiques |
| POST | /{id}/reply/ | Répondre à un avis |

#### Notifications (/api/notifications/)
| Méthode | URL | Description |
|---|---|---|
| GET | / | Mes notifications |
| GET | /unread-count/ | Nombre non lues |
| POST | /mark-all-read/ | Tout marquer comme lu |

---

## 9. FRONTEND REACT

### Structure des routes

```
/ → Accueil (public)
/painters → Liste des peintres (public)
/painters/:id → Profil public peintre (public)
/how-it-works → Comment ça marche (public)

/auth/login → Connexion
/auth/register → Inscription

/dashboard → Tableau de bord (selon rôle)
/profile → Mon profil
/messages → Messagerie
/notifications → Centre de notifications

/client/quotes → Mes devis
/client/quotes/new → Nouvelle demande
/client/bookings → Mes réservations
/client/bookings/:id/pay → Paiement
/client/reviews → Mes évaluations

/painter/profile → Mon profil professionnel
/painter/quotes → Mes devis
/painter/works → Mes travaux
/painter/reviews → Mes évaluations

/admin/painters → Validation peintres
/admin/users → Gestion utilisateurs
/admin/stats → Statistiques
```

### Gestion de l'authentification

L'authentification utilise **JWT** (JSON Web Tokens) :
- **Access token** : durée de vie 60 minutes
- **Refresh token** : durée de vie 7 jours
- **Stockage** : localStorage via Zustand (persist)
- **Refresh automatique** : intercepteur Axios renouvelle le token expiré

### Rôles et protection des routes

```javascript
// Chaque route est protégée par son rôle
<ProtectedRoute allowedRoles={['CLIENT']} />  // CLIENT uniquement
<ProtectedRoute allowedRoles={['PEINTRE']} /> // PEINTRE uniquement
<ProtectedRoute allowedRoles={['ADMIN']} />   // ADMIN uniquement
<ProtectedRoute />                             // Tout utilisateur connecté
```

---

## 10. SYSTÈME DE PAIEMENT

### Architecture abstraite

Le module de paiement est conçu pour accueillir plusieurs fournisseurs :

```
get_gateway('MTN_MOMO')     → MTNMoMoGateway
get_gateway('ORANGE_MONEY') → OrangeMoneyGateway
get_gateway('SIMULATION')   → SimulationGateway (développement)
```

### Flux de paiement

```
1. Devis accepté → Réservation créée (statut: EN_ATTENTE)
2. Client paie l'ACOMPTE (30-50%) → Réservation confirmée
3. Travaux réalisés
4. Client paie le SOLDE → Réservation TERMINÉE
5. Client peut évaluer le peintre
```

### Intégration MTN MoMo (à faire en production)

Pour activer le vrai paiement MTN Mobile Money :

1. S'inscrire sur https://momodeveloper.mtn.com
2. Obtenir les credentials :
   - `MTN_MOMO_SUBSCRIPTION_KEY`
   - `MTN_MOMO_API_KEY`
   - `MTN_MOMO_API_USER`
3. Ajouter dans le fichier `.env` backend
4. Implémenter `MTNMoMoGateway.initiate_payment()` dans `payment_gateway.py`

### Intégration Orange Money (à faire en production)

1. S'inscrire sur https://developer.orange.com/apis/om-cameroun
2. Obtenir : `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`
3. Ajouter dans `.env` et implémenter `OrangeMoneyGateway`

---

## 11. NOTIFICATIONS

### Email (Gmail SMTP)

Les emails partent depuis **kiroseptembre@gmail.com** via Gmail SMTP.

Configuration dans `.env` :
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=kiroseptembre@gmail.com
EMAIL_HOST_PASSWORD=fwvmeipekkywbcjd
```

### Événements déclencheurs

| Événement | Destinataire |
|---|---|
| Nouvelle demande de devis | Peintre |
| Devis envoyé | Client |
| Devis accepté | Peintre |
| Devis refusé | Peintre |
| Réservation confirmée | Client + Peintre |
| Nouvelle étape travaux | Client |
| Travaux terminés | Client |
| Nouvelle évaluation | Peintre |
| Profil validé/refusé | Peintre |
| Nouveau message | Destinataire |

### Notifications in-app

Badge rouge sur l'icône cloche dans la sidebar et le header.
Mise à jour automatique toutes les 30 secondes.

---

## 12. SYSTÈME INTELLIGENT

### Moteur de recommandation (apps/marketplace/engine.py)

L'algorithme calcule un score de pertinence pour chaque peintre :

```python
score = w1 × score_compétences   (30%)
      + w2 × score_localisation   (25%)
      + w3 × score_évaluation     (20%)
      + w4 × score_expérience     (15%)
      + w5 × score_disponibilité  (5%)
      + w6 × score_complétude     (5%)
```

Les poids sont configurables via `PlatformSettings` dans la base de données.

### Assistance IA pour les devis (apps/transactions/ai_assistant.py)

Quand un peintre clique "Assistance IA" sur une demande de devis, le système génère automatiquement :
- Une introduction personnalisée
- Les lignes du devis (préparation, sous-couche, peinture, finitions, nettoyage, transport)
- Les quantités calculées à partir de la surface indiquée
- Les conditions standards

> ⚠️ **Important** : Le peintre reste maître du devis final. L'IA propose, le peintre valide et modifie.

---

## 13. SÉCURITÉ

### Authentification
- JWT avec rotation des refresh tokens
- Blacklist des tokens révoqués
- Tokens stockés en localStorage (côté client)

### Permissions Backend
Chaque endpoint vérifie le rôle :
```python
IsClient          # Réservé aux clients
IsPeintre         # Réservé aux peintres
IsValidatedPeintre # Peintres validés uniquement
IsAdminUser       # Administrateurs uniquement
IsOwnerOrAdmin    # Propriétaire ou admin
```

### Protection des données
- Mots de passe hashés (Django PBKDF2)
- Documents professionnels accessibles uniquement au peintre + admin
- Pages privées exclues de l'indexation Google (robots.txt)
- Variables sensibles dans `.env` (jamais dans le code)

### Configuration production (prod.py)
```python
SECURE_SSL_REDIRECT = True      # Forcer HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 an
X_FRAME_OPTIONS = 'DENY'
```

---

## 14. COMPTES DE TEST

| Rôle | Email | Mot de passe |
|---|---|---|
| **ADMIN** | nathaliemanga594@gmail.com | daniels1234 |
| **CLIENT** | client@paintmatch.cm | Client2024 |
| **PEINTRE** | peintre@paintmatch.cm | Peintre2024 |

Pour créer les comptes de test :
```powershell
py setup_test_users.py
```

Pour valider le peintre de test :
```powershell
py validate_test_painter.py
```

---

## 15. DÉPLOIEMENT EN PRODUCTION

### Checklist avant déploiement

#### Backend
- [ ] Changer `SECRET_KEY` dans `.env`
- [ ] Configurer `DATABASE_URL` avec PostgreSQL
- [ ] Configurer les vraies APIs de paiement (MTN, Orange)
- [ ] Configurer SMTP de production (ou SendGrid/Mailgun)
- [ ] Collecter les fichiers statiques : `py manage.py collectstatic`
- [ ] Utiliser `paintmatch.settings.prod` au lieu de `dev`
- [ ] Désactiver `DEBUG=False`

#### Frontend
- [ ] Modifier `VITE_API_BASE_URL` avec l'URL de production
- [ ] Builder : `npm run build`
- [ ] Déployer le dossier `dist/` sur le serveur

#### Migration SQLite → PostgreSQL
```python
# Dans .env de production
DATABASE_URL=postgres://user:password@localhost:5432/paintmatch
```

### Services recommandés pour le déploiement
- **Backend** : Railway, Render, VPS Ubuntu
- **Frontend** : Vercel, Netlify
- **Base de données** : Railway PostgreSQL, Supabase
- **Fichiers media** : Cloudinary, AWS S3

---

## CONCLUSION

PaintMatch est une plateforme complète et fonctionnelle couvrant l'intégralité du cycle de vie d'une prestation de peinture :

**Recherche → Devis → Réservation → Paiement → Travaux → Évaluation**

Le projet est conçu pour évoluer :
- Ajout d'autres catégories d'artisans (plombiers, électriciens, etc.)
- Application mobile (React Native)
- API publique pour partenaires
- Extension à d'autres pays d'Afrique

---

*Documentation rédigée pour PaintMatch — Version 1.0 — Cameroun 2026*
