"""
PaintMatch — Moteur de recommandation intelligent.

Algorithme de scoring pondéré :
  score = w1 * score_competences
        + w2 * score_localisation
        + w3 * score_evaluation
        + w4 * score_experience
        + w5 * score_disponibilite
        + w6 * score_completude_profil

Les poids sont configurables via PlatformSettings.
Seuls les peintres VALIDÉS et ACTIFS sont éligibles.

Chaque peintre recommandé reçoit une explication lisible
expliquant pourquoi il est proposé.
"""

from django.db.models import Q
from django.utils import timezone
from datetime import date

from apps.accounts.models import PainterProfile, ValidationStatus


# ---------------------------------------------------------------------------
# Poids par défaut (surchargés par PlatformSettings si définis)
# ---------------------------------------------------------------------------
DEFAULT_WEIGHTS = {
    'w_skills':        0.30,  # Correspondance compétences / catégorie
    'w_location':      0.25,  # Localisation (même ville)
    'w_rating':        0.20,  # Note moyenne et nombre d'avis
    'w_experience':    0.15,  # Années d'expérience
    'w_availability':  0.05,  # Disponibilité déclarée
    'w_completeness':  0.05,  # Complétude du profil
}


def get_weights():
    """
    Charge les poids depuis PlatformSettings si disponibles,
    sinon utilise les valeurs par défaut.
    """
    try:
        from apps.administration.models import PlatformSettings
        weights = dict(DEFAULT_WEIGHTS)
        for key in weights:
            try:
                setting = PlatformSettings.objects.get(key=f'recommandation_{key}')
                weights[key] = float(setting.value)
            except Exception:
                pass
        return weights
    except Exception:
        return dict(DEFAULT_WEIGHTS)


# ---------------------------------------------------------------------------
# Fonctions de scoring individuelles — chacune retourne un float entre 0 et 1
# ---------------------------------------------------------------------------

def score_skills(painter, category_id=None, skill_ids=None):
    """
    Score basé sur la correspondance des compétences.
    - Si une catégorie est fournie : vérifie si le peintre a des skills dans cette catégorie
    - Si des skills spécifiques sont fournis : calcule le taux de correspondance
    """
    if not category_id and not skill_ids:
        # Pas de filtre compétences → score basé sur le nombre de compétences
        count = painter.painter_skills.count()
        return min(count / 10.0, 1.0)

    if category_id:
        has_category = painter.painter_skills.filter(
            skill__category_id=category_id
        ).exists()
        if not has_category:
            return 0.0
        # Bonus pour le niveau expert
        expert_count = painter.painter_skills.filter(
            skill__category_id=category_id,
            level='EXPERT'
        ).count()
        confirmed_count = painter.painter_skills.filter(
            skill__category_id=category_id,
            level='CONFIRME'
        ).count()
        total = painter.painter_skills.filter(skill__category_id=category_id).count()
        if total == 0:
            return 0.0
        return min((expert_count * 1.0 + confirmed_count * 0.7) / max(total, 1), 1.0)

    if skill_ids:
        matched = painter.painter_skills.filter(skill_id__in=skill_ids).count()
        return min(matched / len(skill_ids), 1.0)

    return 0.5


def score_location(painter, city=None):
    """
    Score basé sur la localisation.
    - Même ville exacte : 1.0
    - Même région (préfixe 3 lettres) : 0.5
    - Pas de correspondance : 0.0
    - Pas de filtre ville : 0.5 (neutre)
    """
    if not city:
        return 0.5

    painter_city = (painter.user.city or '').lower().strip()
    search_city  = city.lower().strip()

    if not painter_city:
        return 0.1

    if painter_city == search_city:
        return 1.0

    # Correspondance partielle (ex: "Douala Akwa" ↔ "Douala")
    if search_city in painter_city or painter_city in search_city:
        return 0.7

    # Même début (3 premiers caractères)
    if len(painter_city) >= 3 and len(search_city) >= 3:
        if painter_city[:3] == search_city[:3]:
            return 0.4

    return 0.0


def score_rating(painter):
    """
    Score basé sur la note moyenne et le nombre d'avis.
    Note sur 5 → normalisée sur 1.
    Bonus pour les peintres avec beaucoup d'avis (crédibilité).
    """
    rating = float(painter.average_rating or 0)
    count  = painter.total_reviews or 0

    if count == 0:
        return 0.3  # Score neutre pour les nouveaux peintres

    # Score de la note (0 → 0, 5 → 1)
    note_score = rating / 5.0

    # Facteur de crédibilité (plus d'avis = plus fiable)
    credibility = min(count / 20.0, 1.0)

    return note_score * (0.7 + 0.3 * credibility)


def score_experience(painter):
    """
    Score basé sur les années d'expérience.
    0 an → 0.1, 5 ans → 0.5, 10 ans+ → 1.0
    """
    years = painter.years_experience or 0
    return min(years / 10.0, 1.0) if years > 0 else 0.1


def score_availability(painter, date_start=None, date_end=None):
    """
    Score basé sur la disponibilité déclarée.
    - Disponibilité couvrant la période demandée : 1.0
    - Disponibilité partielle : 0.5
    - Aucune disponibilité déclarée : 0.3 (neutre)
    - Indisponible sur la période : 0.0
    """
    availabilities = painter.availabilities.filter(is_available=True)

    if not availabilities.exists():
        return 0.3

    if not date_start or not date_end:
        return 0.7  # Disponibilités déclarées mais pas de filtre dates

    # Vérifie si une disponibilité couvre la période demandée
    covering = availabilities.filter(
        date_start__lte=date_start,
        date_end__gte=date_end,
    )
    if covering.exists():
        return 1.0

    # Disponibilité partielle
    partial = availabilities.filter(
        date_start__lte=date_end,
        date_end__gte=date_start,
    )
    if partial.exists():
        return 0.5

    return 0.0


def score_completeness(painter):
    """
    Score basé sur la complétude du profil.
    Encourage les peintres à renseigner toutes leurs informations.
    """
    points = 0
    total  = 7

    if painter.bio:                                   points += 1
    if painter.years_experience:                      points += 1
    if painter.professional_id:                       points += 1
    if painter.painter_skills.exists():               points += 1
    if painter.qualifications.exists():               points += 1
    if painter.professional_docs.exists():            points += 1
    if painter.portfolio_items.exists():              points += 1

    return points / total


# ---------------------------------------------------------------------------
# Génération de l'explication (texte lisible)
# ---------------------------------------------------------------------------

def generate_explanation(painter, scores, city=None, category_id=None):
    """
    Génère une explication courte et lisible en français
    expliquant pourquoi ce peintre est recommandé.
    """
    reasons = []

    if city and scores['location'] >= 0.7:
        reasons.append(f"intervient à {painter.user.city}")

    if category_id and scores['skills'] >= 0.5:
        try:
            from apps.services.models import ServiceCategory
            cat = ServiceCategory.objects.get(pk=category_id)
            reasons.append(f"maîtrise {cat.name.lower()}")
        except Exception:
            pass

    if scores['rating'] >= 0.7 and painter.total_reviews > 0:
        reasons.append(
            f"noté {float(painter.average_rating):.1f}/5 sur {painter.total_reviews} avis"
        )
    elif painter.total_reviews == 0:
        reasons.append("nouveau peintre sur la plateforme")

    if scores['experience'] >= 0.5:
        years = painter.years_experience
        reasons.append(f"{years} an{'s' if years > 1 else ''} d'expérience")

    if scores['availability'] >= 0.7:
        reasons.append("disponible")

    if not reasons:
        reasons.append("profil correspondant à votre recherche")

    return "Proposé car il " + ", ".join(reasons) + "."


# ---------------------------------------------------------------------------
# Moteur principal
# ---------------------------------------------------------------------------

def recommend_painters(
    city=None,
    category_id=None,
    skill_ids=None,
    date_start=None,
    date_end=None,
    limit=20,
    min_score=0.0,
):
    """
    Point d'entrée principal du moteur de recommandation.

    Retourne une liste triée de peintres avec leur score et leur explication.

    Paramètres :
        city         : ville recherchée (str)
        category_id  : ID de la catégorie de prestation
        skill_ids    : liste d'IDs de compétences spécifiques
        date_start   : date de début souhaitée
        date_end     : date de fin souhaitée
        limit        : nombre maximum de résultats
        min_score    : score minimum pour être inclus dans les résultats

    Retourne :
        liste de dicts { painter, score, explanation, scores_detail }
    """
    weights = get_weights()

    # Récupération des peintres éligibles (validés, actifs)
    qs = PainterProfile.objects.filter(
        validation_status=ValidationStatus.VALIDE,
        user__is_active=True,
    )

    # Filtre strict par ville si fourni
    if city:
        city_strip = city.strip()
        qs = qs.filter(
            Q(user__city__iexact=city_strip) |
            Q(user__city__icontains=city_strip)
        )

    painters = qs.select_related('user').prefetch_related(
        'painter_skills__skill__category',
        'qualifications',
        'professional_docs',
        'portfolio_items',
        'availabilities',
    )

    # Calcul du score pour chaque peintre
    results = []

    for painter in painters:
        scores = {
            'skills':       score_skills(painter, category_id, skill_ids),
            'location':     score_location(painter, city),
            'rating':       score_rating(painter),
            'experience':   score_experience(painter),
            'availability': score_availability(painter, date_start, date_end),
            'completeness': score_completeness(painter),
        }

        # Si un filtre de catégorie est actif et que le peintre n'a pas les compétences → exclure
        if category_id and scores['skills'] == 0.0:
            continue

        # Score final pondéré
        final_score = (
            weights['w_skills']       * scores['skills']       +
            weights['w_location']     * scores['location']      +
            weights['w_rating']       * scores['rating']        +
            weights['w_experience']   * scores['experience']    +
            weights['w_availability'] * scores['availability']  +
            weights['w_completeness'] * scores['completeness']
        )

        if final_score < min_score:
            continue

        explanation = generate_explanation(painter, scores, city, category_id)

        results.append({
            'painter':       painter,
            'score':         round(final_score, 4),
            'explanation':   explanation,
            'scores_detail': scores,
        })

    # Tri par score décroissant
    results.sort(key=lambda x: x['score'], reverse=True)

    return results[:limit]
