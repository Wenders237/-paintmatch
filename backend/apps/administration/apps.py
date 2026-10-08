from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AdministrationConfig(AppConfig):
    name = 'apps.administration'
    label = 'administration'
    verbose_name = _('Administration et statistiques')
