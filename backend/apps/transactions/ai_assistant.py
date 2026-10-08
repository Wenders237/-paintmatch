"""
PaintMatch — Assistant IA pour la rédaction des devis.

Génère une structure de devis suggérée à partir des informations
fournies dans la demande (type de travaux, surface, localisation).

Règles :
- Ne jamais inventer des prix — les estimations sont basées sur des
  fourchettes configurables dans PlatformSettings
- Le peintre reste maître du devis final
- Les suggestions sont clairement marquées comme non contractuelles
"""

from decimal import Decimal


# ---------------------------------------------------------------------------
# Prix de référence par défaut (FCFA/m²)
# Configurables via PlatformSettings avec les clés prix_ref_*
# ---------------------------------------------------------------------------
DEFAULT_PRICES = {
    1: {'min': 2000,  'max': 5000,  'name': 'Peinture intérieure'},      # cat 1
    2: {'min': 3000,  'max': 7000,  'name': 'Peinture extérieure'},      # cat 2
    3: {'min': 4000,  'max': 9000,  'name': 'Ravalement de façade'},     # cat 3
    4: {'min': 5000,  'max': 12000, 'name': 'Peinture décorative'},      # cat 4
    5: {'min': 6000,  'max': 15000, 'name': 'Traitement anti-humidité'}, # cat 5
    6: {'min': 5000,  'max': 10000, 'name': 'Imperméabilisation'},       # cat 6
}

# Postes standards d'un devis de peinture
STANDARD_ITEMS = {
    'preparation': {
        'description': 'Préparation des surfaces (nettoyage, ponçage, rebouchage)',
        'unit': 'm²',
        'coeff': 0.15,   # 15% du prix principal
    },
    'protection': {
        'description': 'Protection des sols et mobiliers',
        'unit': 'forfait',
        'fixed': True,
        'amount': 15000,
    },
    'primer': {
        'description': 'Application de sous-couche primaire',
        'unit': 'm²',
        'coeff': 0.20,
    },
    'main_work': {
        'description': None,  # Sera rempli dynamiquement
        'unit': 'm²',
        'coeff': 1.0,   # Prix principal
    },
    'finishing': {
        'description': 'Finitions et retouches',
        'unit': 'm²',
        'coeff': 0.10,
    },
    'cleanup': {
        'description': 'Nettoyage et évacuation des déchets',
        'unit': 'forfait',
        'fixed': True,
        'amount': 10000,
    },
    'transport': {
        'description': 'Déplacement et transport du matériel',
        'unit': 'forfait',
        'fixed': True,
        'amount': 20000,
    },
}


def get_price_reference(category_id):
    """Charge les prix de référence depuis PlatformSettings ou utilise les défauts."""
    prices = dict(DEFAULT_PRICES.get(category_id, {'min': 3000, 'max': 8000, 'name': 'Travaux de peinture'}))
    try:
        from apps.administration.models import PlatformSettings
        min_setting = PlatformSettings.objects.filter(
            key=f'prix_ref_cat{category_id}_min'
        ).first()
        max_setting = PlatformSettings.objects.filter(
            key=f'prix_ref_cat{category_id}_max'
        ).first()
        if min_setting:
            prices['min'] = float(min_setting.value)
        if max_setting:
            prices['max'] = float(max_setting.value)
    except Exception:
        pass
    return prices


def generate_quote_suggestion(quote_request):
    """
    Génère une structure de devis suggérée pour le peintre.

    Retourne :
        {
            'intro_text': str,
            'items': [ { description, quantity, unit, unit_price, total_price }, ... ],
            'estimated_total': Decimal,
            'notes': str,
            'disclaimer': str,
        }
    """
    surface      = float(quote_request.surface_m2 or 30)  # 30m² par défaut
    category_id  = quote_request.category_id
    title        = quote_request.title
    location     = quote_request.location
    client_name  = quote_request.client.get_full_name()

    # Prix de référence pour cette catégorie
    price_ref  = get_price_reference(category_id)
    avg_price  = (price_ref['min'] + price_ref['max']) / 2
    work_name  = price_ref.get('name', 'Travaux de peinture')

    # Génération des lignes du devis
    items = []
    total = Decimal('0')

    for key, item_def in STANDARD_ITEMS.items():
        if item_def.get('fixed'):
            qty        = Decimal('1')
            unit       = 'forfait'
            unit_price = Decimal(str(item_def['amount']))
        else:
            qty        = Decimal(str(round(surface, 2)))
            unit       = item_def['unit']
            unit_price = Decimal(str(round(avg_price * item_def['coeff'])))

        description = item_def['description']
        if key == 'main_work':
            description = f'{work_name} — {title}'

        line_total = qty * unit_price
        total += line_total

        items.append({
            'description': description,
            'quantity':    qty,
            'unit':        unit,
            'unit_price':  unit_price,
            'total_price': line_total,
            'order':       len(items),
        })

    # Texte d'introduction suggéré
    intro_text = (
        f"Suite à votre demande concernant \"{title}\" à {location}, "
        f"j'ai l'honneur de vous soumettre le présent devis pour la réalisation "
        f"des travaux de peinture. Ce devis a été établi sur la base d'une surface "
        f"estimée à {surface} m².\n\n"
        f"Les travaux seront réalisés dans les règles de l'art, avec des matériaux "
        f"de qualité. N'hésitez pas à me contacter pour toute question."
    )

    notes = (
        "• Devis valable 30 jours à compter de sa date d'émission.\n"
        "• Un acompte de 30% sera demandé à la confirmation.\n"
        "• Les matériaux sont inclus dans le devis.\n"
        "• Délai d'exécution estimé : à définir après visite du chantier."
    )

    disclaimer = (
        "⚠️ Ces suggestions sont générées automatiquement à titre indicatif. "
        "Les prix sont des estimations basées sur les tarifs moyens du marché. "
        "Vous êtes libre de modifier toutes les lignes avant d'envoyer le devis."
    )

    return {
        'intro_text':       intro_text,
        'items':            items,
        'estimated_total':  total,
        'notes':            notes,
        'disclaimer':       disclaimer,
        'surface_used':     surface,
        'price_range':      f"{price_ref['min']:,} – {price_ref['max']:,} FCFA/m²",
    }
