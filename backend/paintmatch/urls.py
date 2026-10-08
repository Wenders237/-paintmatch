"""
PaintMatch — Configuration des URLs racine du projet.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),

    # API v1
    path('api/', include([

        # Authentification et profils
        path('', include('apps.accounts.urls')),

        # Services
        path('services/', include('apps.services.urls')),

        # Marketplace
        path('marketplace/', include('apps.marketplace.urls')),

        # Évaluations
        path('reviews/', include('apps.reviews.urls')),

        # Notifications in-app
        path('notifications/', include('apps.notifications.urls')),

        # Messagerie
        path('messaging/', include('apps.messaging.urls')),

        # Transactions
        path('transactions/', include('apps.transactions.urls')),

        # Administration
        path('admin-panel/', include('apps.administration.urls')),

        # Documentation API
        path('schema/', SpectacularAPIView.as_view(), name='schema'),
        path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
