from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ReviewsConfig(AppConfig):
    name = 'apps.reviews'
    label = 'reviews'
    verbose_name = _('Évaluations')
