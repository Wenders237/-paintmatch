from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AccountsConfig(AppConfig):
    name = 'apps.accounts'
    label = 'accounts'            # label utilisé dans AUTH_USER_MODEL et les FK
    verbose_name = _('Comptes et utilisateurs')

    def ready(self):
        # Import des signaux au démarrage de l'application
        import apps.accounts.signals  # noqa
