"""
Corrige les devis en BROUILLON → les passe à ENVOYE.
Utilisation : py fix_quotes.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paintmatch.settings.dev')
django.setup()

from django.utils import timezone
from apps.transactions.models import Quote

drafts = Quote.objects.filter(status='BROUILLON', items__isnull=False).distinct()
print(f'\n{drafts.count()} devis en brouillon trouvés.\n')

for q in drafts:
    if q.items.exists():
        q.status  = Quote.Status.ENVOYE
        q.sent_at = timezone.now()
        q.save()
        print(f'[OK] Devis envoyé : {q.request.title} → {q.request.client.email}')
    else:
        print(f'[SKIP] Devis sans items : {q.id}')

print('\nTerminé.')
