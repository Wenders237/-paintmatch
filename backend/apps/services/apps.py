from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ServicesConfig(AppConfig):
    name = 'apps.services'
    label = 'services'
    verbose_name = _('Services et compétences')
