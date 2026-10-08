from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class MarketplaceConfig(AppConfig):
    name = 'apps.marketplace'
    label = 'marketplace'
    verbose_name = _('Marketplace et recherche')
