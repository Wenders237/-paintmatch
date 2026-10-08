from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class TransactionsConfig(AppConfig):
    name = 'apps.transactions'
    label = 'transactions'
    verbose_name = _('Devis, réservations et paiements')
