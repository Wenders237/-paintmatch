"""
PaintMatch — Settings de production.
Ne jamais activer DEBUG=True en production.
"""

from .base import *  # noqa
from .base import env  # réutilise l'instance déjà créée dans base.py

# ---------------------------------------------------------------------------
# Mode production
# ---------------------------------------------------------------------------
DEBUG = False

# ---------------------------------------------------------------------------
# Sécurité HTTPS
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT             = True
SESSION_COOKIE_SECURE           = True
CSRF_COOKIE_SECURE              = True
SECURE_HSTS_SECONDS             = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
SECURE_HSTS_PRELOAD             = True
SECURE_BROWSER_XSS_FILTER       = True
SECURE_CONTENT_TYPE_NOSNIFF     = True
X_FRAME_OPTIONS                 = 'DENY'

# ---------------------------------------------------------------------------
# Validateurs de mot de passe stricts en production
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# CORS — Domaines de production autorisés
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# E-mail SMTP en production
# ---------------------------------------------------------------------------
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = env('EMAIL_HOST',          default='smtp.gmail.com')
EMAIL_PORT          = env.int('EMAIL_PORT',       default=587)
EMAIL_HOST_USER     = env('EMAIL_HOST_USER',      default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD',  default='')
EMAIL_USE_TLS       = True
DEFAULT_FROM_EMAIL  = env('DEFAULT_FROM_EMAIL',   default='PaintMatch <no-reply@paintmatch.cm>')

# ---------------------------------------------------------------------------
# Base de données PostgreSQL en production
# ---------------------------------------------------------------------------
# DATABASE_URL=postgres://user:password@localhost:5432/paintmatch

# ---------------------------------------------------------------------------
# Journalisation en production
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': str(BASE_DIR / 'logs' / 'paintmatch.log'),  # noqa
            'formatter': 'verbose',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {'handlers': ['file'], 'level': 'ERROR', 'propagate': False},
        'paintmatch': {'handlers': ['file', 'console'], 'level': 'WARNING', 'propagate': False},
    },
}
