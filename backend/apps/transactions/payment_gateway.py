"""
PaintMatch — Module de paiement abstrait.

Architecture :
  PaymentGateway (interface abstraite)
    ├── MTNMoMoGateway     (MTN Mobile Money Cameroun)
    ├── OrangeMoneyGateway (Orange Money Cameroun)
    └── SimulationGateway  (simulation pour le développement)

Usage :
    gateway = get_gateway('MTN_MOMO')
    result  = gateway.initiate_payment(amount=50000, phone='237691000001', reference='PAY-001')

Les identifiants API réels sont configurés via les variables d'environnement.
Ne jamais stocker des clés API dans le code source.
"""

import uuid
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger('paintmatch')


# ---------------------------------------------------------------------------
# Structure de résultat d'un paiement
# ---------------------------------------------------------------------------

@dataclass
class PaymentResult:
    """Résultat standardisé d'une opération de paiement."""
    success:       bool
    transaction_ref: str       # Référence unique de la transaction
    status:        str         # TRAITE | ECHOUE | EN_ATTENTE
    message:       str         # Message lisible
    provider_data: dict = None # Données brutes du fournisseur (pour debug)


# ---------------------------------------------------------------------------
# Interface abstraite
# ---------------------------------------------------------------------------

class PaymentGateway(ABC):
    """Interface commune à tous les fournisseurs de paiement."""

    @abstractmethod
    def initiate_payment(
        self,
        amount: int,
        phone: str,
        reference: str,
        description: str = '',
    ) -> PaymentResult:
        """
        Initie un paiement Mobile Money.

        Args:
            amount      : Montant en FCFA (entier)
            phone       : Numéro de téléphone du payeur (format 237XXXXXXXXX)
            reference   : Référence unique de la transaction côté PaintMatch
            description : Description du paiement

        Returns:
            PaymentResult avec le statut de la transaction
        """
        pass

    @abstractmethod
    def check_status(self, transaction_ref: str) -> PaymentResult:
        """Vérifie le statut d'une transaction existante."""
        pass

    @abstractmethod
    def refund(self, transaction_ref: str, amount: int) -> PaymentResult:
        """Effectue un remboursement."""
        pass


# ---------------------------------------------------------------------------
# Simulation (développement)
# ---------------------------------------------------------------------------

class SimulationGateway(PaymentGateway):
    """
    Simule un paiement en développement.
    Tous les paiements réussissent automatiquement.
    Utile pour tester le flux complet sans API réelle.
    """

    def initiate_payment(self, amount, phone, reference, description=''):
        logger.info(
            f'[SIMULATION] Paiement simulé : {amount} FCFA → {phone} | ref: {reference}'
        )
        return PaymentResult(
            success=True,
            transaction_ref=f'SIM-{uuid.uuid4().hex[:12].upper()}',
            status='TRAITE',
            message=f'Paiement simulé de {amount:,} FCFA traité avec succès.',
            provider_data={'simulated': True, 'amount': amount, 'phone': phone},
        )

    def check_status(self, transaction_ref):
        return PaymentResult(
            success=True,
            transaction_ref=transaction_ref,
            status='TRAITE',
            message='Transaction simulée — statut : TRAITE',
        )

    def refund(self, transaction_ref, amount):
        logger.info(f'[SIMULATION] Remboursement simulé : {amount} FCFA | ref: {transaction_ref}')
        return PaymentResult(
            success=True,
            transaction_ref=f'REF-{uuid.uuid4().hex[:12].upper()}',
            status='REMBOURSE',
            message=f'Remboursement simulé de {amount:,} FCFA effectué.',
        )


# ---------------------------------------------------------------------------
# MTN Mobile Money (à compléter avec les identifiants réels)
# ---------------------------------------------------------------------------

class MTNMoMoGateway(PaymentGateway):
    """
    Intégration MTN Mobile Money Cameroun.

    Variables d'environnement requises :
        MTN_MOMO_SUBSCRIPTION_KEY : Clé d'abonnement API
        MTN_MOMO_API_KEY          : Clé API
        MTN_MOMO_API_USER         : ID utilisateur API
        MTN_MOMO_ENVIRONMENT      : 'sandbox' ou 'production'

    Documentation : https://momodeveloper.mtn.com
    """

    def __init__(self):
        import os
        self.subscription_key = os.environ.get('MTN_MOMO_SUBSCRIPTION_KEY', '')
        self.api_key          = os.environ.get('MTN_MOMO_API_KEY', '')
        self.api_user         = os.environ.get('MTN_MOMO_API_USER', '')
        self.environment      = os.environ.get('MTN_MOMO_ENVIRONMENT', 'sandbox')
        self.base_url         = (
            'https://sandbox.momodeveloper.mtn.com'
            if self.environment == 'sandbox'
            else 'https://proxy.momoapi.mtn.com'
        )

    def _is_configured(self):
        return bool(self.subscription_key and self.api_key and self.api_user)

    def initiate_payment(self, amount, phone, reference, description=''):
        if not self._is_configured():
            logger.warning('MTN MoMo non configuré — utilisation de la simulation')
            return SimulationGateway().initiate_payment(amount, phone, reference, description)

        # TODO : Implémenter l'appel API MTN MoMo réel
        # Étapes :
        # 1. POST /collection/token/ → obtenir le token Bearer
        # 2. POST /collection/v1_0/requesttopay → initier le paiement
        # 3. GET  /collection/v1_0/requesttopay/{referenceId} → vérifier le statut
        logger.info(f'MTN MoMo : paiement initié {amount} FCFA → {phone}')
        raise NotImplementedError('Intégration MTN MoMo à implémenter avec les identifiants réels.')

    def check_status(self, transaction_ref):
        if not self._is_configured():
            return SimulationGateway().check_status(transaction_ref)
        raise NotImplementedError('Intégration MTN MoMo à implémenter.')

    def refund(self, transaction_ref, amount):
        if not self._is_configured():
            return SimulationGateway().refund(transaction_ref, amount)
        raise NotImplementedError('Intégration MTN MoMo à implémenter.')


# ---------------------------------------------------------------------------
# Orange Money (à compléter avec les identifiants réels)
# ---------------------------------------------------------------------------

class OrangeMoneyGateway(PaymentGateway):
    """
    Intégration Orange Money Cameroun.

    Variables d'environnement requises :
        ORANGE_MONEY_CLIENT_ID     : Client ID
        ORANGE_MONEY_CLIENT_SECRET : Client Secret
        ORANGE_MONEY_MERCHANT_KEY  : Clé marchand

    Documentation : https://developer.orange.com/apis/om-cameroun
    """

    def __init__(self):
        import os
        self.client_id     = os.environ.get('ORANGE_MONEY_CLIENT_ID', '')
        self.client_secret = os.environ.get('ORANGE_MONEY_CLIENT_SECRET', '')
        self.merchant_key  = os.environ.get('ORANGE_MONEY_MERCHANT_KEY', '')
        self.base_url      = 'https://api.orange.com/orange-money-webpay/cm/v1'

    def _is_configured(self):
        return bool(self.client_id and self.client_secret and self.merchant_key)

    def initiate_payment(self, amount, phone, reference, description=''):
        if not self._is_configured():
            logger.warning('Orange Money non configuré — utilisation de la simulation')
            return SimulationGateway().initiate_payment(amount, phone, reference, description)

        # TODO : Implémenter l'appel API Orange Money réel
        logger.info(f'Orange Money : paiement initié {amount} FCFA → {phone}')
        raise NotImplementedError('Intégration Orange Money à implémenter avec les identifiants réels.')

    def check_status(self, transaction_ref):
        if not self._is_configured():
            return SimulationGateway().check_status(transaction_ref)
        raise NotImplementedError('Intégration Orange Money à implémenter.')

    def refund(self, transaction_ref, amount):
        if not self._is_configured():
            return SimulationGateway().refund(transaction_ref, amount)
        raise NotImplementedError('Intégration Orange Money à implémenter.')


# ---------------------------------------------------------------------------
# Factory — retourne le bon gateway selon le moyen de paiement
# ---------------------------------------------------------------------------

def get_gateway(method: str) -> PaymentGateway:
    """
    Retourne le gateway approprié selon le moyen de paiement.

    Args:
        method : 'MTN_MOMO' | 'ORANGE_MONEY' | 'SIMULATION'

    Returns:
        Instance du gateway correspondant
    """
    gateways = {
        'MTN_MOMO':     MTNMoMoGateway,
        'ORANGE_MONEY': OrangeMoneyGateway,
        'SIMULATION':   SimulationGateway,
    }
    gateway_class = gateways.get(method, SimulationGateway)
    return gateway_class()
