"""
Diagnostic devis — statuts exacts.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paintmatch.settings.dev')
django.setup()

from apps.transactions.models import Quote, QuoteRequest

print('\n=== TOUS LES DEVIS EN BASE ===\n')
quotes = Quote.objects.select_related('painter__user', 'request__client').all()
if not quotes.exists():
    print('[INFO] Aucun devis en base du tout.')
else:
    for q in quotes:
        print(f'  Statut  : {q.status}')
        print(f'  Peintre : {q.painter.user.email}')
        print(f'  Client  : {q.request.client.email}')
        print(f'  Titre   : {q.request.title}')
        print(f'  Items   : {q.items.count()}')
        print()

print('\n=== DEMANDES DE DEVIS ===\n')
requests = QuoteRequest.objects.select_related('client', 'painter__user').all()
if not requests.exists():
    print('[INFO] Aucune demande de devis en base.')
else:
    for r in requests:
        has_quote = hasattr(r, 'quote')
        print(f'  Client  : {r.client.email}')
        print(f'  Peintre : {r.painter.user.email}')
        print(f'  Titre   : {r.title}')
        print(f'  Statut  : {r.status}')
        print(f'  A devis : {has_quote}')
        if has_quote:
            print(f'  → Devis statut : {r.quote.status}')
        print()
