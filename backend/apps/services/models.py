"""
PaintMatch — Modèles de l'application services.

Contient :
- ServiceCategory  : catégories de prestations (peinture intérieure, façade, etc.)
- Skill            : compétences référencées par catégorie
- PainterSkill     : compétences d'un peintre avec niveau
- Qualification    : diplômes/certifications du peintre
- ProfessionalDoc  : documents professionnels (RCCM, assurance, etc.)
- Portfolio        : réalisations du peintre (photos + description)
- ServiceOffer     : offres de services publiées par le peintre
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


# ---------------------------------------------------------------------------
# Catégories de prestations
# ---------------------------------------------------------------------------

class ServiceCategory(models.Model):
    """
    Catégories de prestations de peinture.
    Gérées par l'administrateur.
    Exemples : Peinture intérieure, Peinture extérieure, Ravalement de façade,
               Peinture décorative, Traitement anti-humidité...
    """
    name = models.CharField(_('nom'), max_length=100, unique=True)
    slug = models.SlugField(_('slug'), max_length=120, unique=True)
    description = models.TextField(_('description'), blank=True)
    icon = models.CharField(
        _('icône'),
        max_length=50,
        blank=True,
        help_text=_('Nom de l\'icône (ex: paint-bucket)'),
    )
    is_active = models.BooleanField(_('active'), default=True)
    order = models.PositiveSmallIntegerField(_('ordre d\'affichage'), default=0)

    class Meta:
        verbose_name = _('catégorie de prestation')
        verbose_name_plural = _('catégories de prestations')
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Compétences
# ---------------------------------------------------------------------------

class Skill(models.Model):
    """
    Compétences techniques référencées, rattachées à une catégorie.
    Exemples : Application d'enduit, Peinture au rouleau, Traitement des fissures...
    """
    name = models.CharField(_('nom'), max_length=100)
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name='skills',
        verbose_name=_('catégorie'),
    )
    is_active = models.BooleanField(_('active'), default=True)

    class Meta:
        verbose_name = _('compétence')
        verbose_name_plural = _('compétences')
        unique_together = [('name', 'category')]
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.category.name})'


class SkillLevel(models.TextChoices):
    DEBUTANT  = 'DEBUTANT',  _('Débutant')
    CONFIRME  = 'CONFIRME',  _('Confirmé')
    EXPERT    = 'EXPERT',    _('Expert')


class PainterSkill(models.Model):
    """
    Compétence maîtrisée par un peintre, avec son niveau.
    """
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='painter_skills',
        verbose_name=_('peintre'),
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='painter_skills',
        verbose_name=_('compétence'),
    )
    level = models.CharField(
        _('niveau'),
        max_length=20,
        choices=SkillLevel.choices,
        default=SkillLevel.CONFIRME,
    )

    class Meta:
        verbose_name = _('compétence du peintre')
        verbose_name_plural = _('compétences du peintre')
        unique_together = [('painter', 'skill')]

    def __str__(self):
        return f'{self.painter} — {self.skill.name} ({self.level})'


# ---------------------------------------------------------------------------
# Qualifications
# ---------------------------------------------------------------------------

class Qualification(models.Model):
    """
    Diplômes, certifications et formations du peintre.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='qualifications',
        verbose_name=_('peintre'),
    )
    title = models.CharField(_('intitulé'), max_length=200)
    issuing_body = models.CharField(_('organisme émetteur'), max_length=200, blank=True)
    date_obtained = models.DateField(_('date d\'obtention'), blank=True, null=True)
    description = models.TextField(_('description'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('qualification')
        verbose_name_plural = _('qualifications')
        ordering = ['-date_obtained']

    def __str__(self):
        return f'{self.title} — {self.painter}'


# ---------------------------------------------------------------------------
# Documents professionnels
# ---------------------------------------------------------------------------

class DocumentType(models.TextChoices):
    RCCM        = 'RCCM',        _('RCCM / Registre de commerce')
    DIPLOME     = 'DIPLOME',     _('Diplôme')
    CERTIFICATION = 'CERTIF',   _('Certification')
    ASSURANCE   = 'ASSURANCE',   _('Attestation d\'assurance')
    AUTRE       = 'AUTRE',       _('Autre document')


class ProfessionalDoc(models.Model):
    """
    Documents professionnels uploadés par le peintre.
    Accessibles uniquement par le peintre et les administrateurs.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='professional_docs',
        verbose_name=_('peintre'),
    )
    doc_type = models.CharField(
        _('type de document'),
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.AUTRE,
    )
    title = models.CharField(_('titre'), max_length=200)
    file = models.FileField(
        _('fichier'),
        upload_to='professional_docs/%Y/%m/',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(_('vérifié par admin'), default=False)

    class Meta:
        verbose_name = _('document professionnel')
        verbose_name_plural = _('documents professionnels')
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.get_doc_type_display()} — {self.painter}'


# ---------------------------------------------------------------------------
# Portfolio (réalisations)
# ---------------------------------------------------------------------------

class Portfolio(models.Model):
    """
    Réalisations du peintre présentées sur son profil public.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='portfolio_items',
        verbose_name=_('peintre'),
    )
    title = models.CharField(_('titre'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='portfolio_items',
        verbose_name=_('catégorie'),
    )
    location = models.CharField(_('lieu'), max_length=150, blank=True)
    date_completed = models.DateField(_('date de réalisation'), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('réalisation')
        verbose_name_plural = _('réalisations')
        ordering = ['-date_completed', '-created_at']

    def __str__(self):
        return f'{self.title} — {self.painter}'


class PortfolioImage(models.Model):
    """
    Images associées à une réalisation du portfolio.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('réalisation'),
    )
    image = models.FileField(
        _('image'),
        upload_to='portfolio/%Y/%m/',
    )
    caption = models.CharField(_('légende'), max_length=200, blank=True)
    is_cover = models.BooleanField(_('image principale'), default=False)
    order = models.PositiveSmallIntegerField(_('ordre'), default=0)

    class Meta:
        verbose_name = _('image de réalisation')
        verbose_name_plural = _('images de réalisation')
        ordering = ['order', 'id']

    def __str__(self):
        return f'Image — {self.portfolio.title}'


# ---------------------------------------------------------------------------
# Offres de services
# ---------------------------------------------------------------------------

class ServiceOffer(models.Model):
    """
    Services proposés par le peintre avec fourchette de prix indicative.
    Ces informations sont publiques sur le profil du peintre.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='service_offers',
        verbose_name=_('peintre'),
    )
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name='service_offers',
        verbose_name=_('catégorie'),
    )
    title = models.CharField(_('titre'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    price_range_min = models.DecimalField(
        _('prix minimum (FCFA/m²)'),
        max_digits=10,
        decimal_places=0,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
    )
    price_range_max = models.DecimalField(
        _('prix maximum (FCFA/m²)'),
        max_digits=10,
        decimal_places=0,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
    )
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('offre de service')
        verbose_name_plural = _('offres de services')
        ordering = ['category', 'title']

    def __str__(self):
        return f'{self.title} — {self.painter}'
