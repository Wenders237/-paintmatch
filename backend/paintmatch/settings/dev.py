"""
PaintMatch — Settings de développement.
"""

from .base import *  # noqa

# ---------------------------------------------------------------------------
# Mode debug
# ---------------------------------------------------------------------------
DEBUG = True

# ---------------------------------------------------------------------------
# CORS — Autoriser le frontend React en développement
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
]
CORS_ALLOW_CREDENTIALS = True
# Autorise toutes les origines en développement local
CORS_ALLOW_ALL_ORIGINS = True

# ---------------------------------------------------------------------------
# E-mail — Console en développement (pas d'envoi réel)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'kiroseptembre@gmail.com'
EMAIL_HOST_PASSWORD = 'fwvmeipekkywbcjd'
DEFAULT_FROM_EMAIL = 'PaintMatch <kiroseptembre@gmail.com>'

# ---------------------------------------------------------------------------
# Apps additionnelles de développement
# ---------------------------------------------------------------------------
INSTALLED_APPS += ['django_extensions']  # noqa

# ---------------------------------------------------------------------------
# Barre de debug (optionnel — décommenter si installé)
# ---------------------------------------------------------------------------
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# ---------------------------------------------------------------------------
# Journalisation simple en développement
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
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'paintmatch': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
