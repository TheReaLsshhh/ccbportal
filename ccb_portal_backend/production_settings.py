"""
Production settings for CCB Portal on Render
This file contains production-specific settings that override the main settings.py
"""

import os
from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Force HTTPS in production
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Update allowed hosts for production
# If environment variable ALLOWED_HOSTS is set to '*', allow all hosts
if os.getenv('ALLOWED_HOSTS') == '*':
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = [
        'ccbeacademyportal-backend.onrender.com',
        'ccb-portal-backend.onrender.com',
        'localhost',
        '127.0.0.1',
    ]

# CORS configuration for production
CORS_ALLOWED_ORIGINS = [
    "https://ccbeacademyportal-frontend.onrender.com",
    "https://ccb-portal-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Ensure the backend URL is properly set
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL', 'https://ccbeacademyportal-backend.onrender.com')

# Cloudinary Configuration for Production
# Use Cloudinary for image storage in production
import cloudinary
from cloudinary import config as cloudinary_config

# Configure Cloudinary from environment variables
# We use strip() to remove any accidental whitespace from copy-pasting
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'your-cloud-name').strip()
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', 'your-api-key').strip()
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'your-api-secret').strip()

# Initialize Cloudinary SDK directly (for direct usage)
cloudinary_config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# Ensure CLOUDINARY_URL is available for libraries that rely on it
if not os.getenv('CLOUDINARY_URL') and all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]) and CLOUDINARY_CLOUD_NAME != 'your-cloud-name':
    os.environ['CLOUDINARY_URL'] = f"cloudinary://{CLOUDINARY_API_KEY}:{CLOUDINARY_API_SECRET}@{CLOUDINARY_CLOUD_NAME}"

# Configure django-cloudinary-storage specific settings
# This is CRITICAL: The storage backend looks for this dict, NOT just the SDK config
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
    'API_KEY': CLOUDINARY_API_KEY,
    'API_SECRET': CLOUDINARY_API_SECRET,
    'SECURE_URL': True,
    'MEDIA_TAG': 'media',
    'STATIC_TAG': 'static',
}

# Cloudinary storage configuration - Only for media files (images)
# Django 4.2+ uses STORAGES dictionary
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# Legacy setting for older libraries (optional but good for compatibility)
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Media files configuration for Cloudinary
# We do NOT set MEDIA_URL to the Cloudinary domain here because the storage backend
# handles full URL generation. Setting it to /media/ keeps Django happy.
MEDIA_URL = '/media/' 
MEDIA_ROOT = ''  # Not used with Cloudinary

# Static files configuration - Keep local for CSS, JS, etc.
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# STATICFILES_STORAGE is deprecated in Django 4.2+ and handled by STORAGES above

# Ensure static files directory exists
import os
os.makedirs(STATIC_ROOT, exist_ok=True)

# Email configuration (using Brevo)
EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
ANYMAIL = {
    "BREVO_API_KEY": os.getenv("BREVO_API_KEY", ""),
}

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Session and CSRF security
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Database configuration (PostgreSQL from Render)
if not DEBUG:
    import dj_database_url
    db_url = os.getenv('DATABASE_URL')
    if db_url and 'mysql' in db_url:
         DATABASES = {
            'default': dj_database_url.config(
                default=db_url,
                conn_max_age=600,
                conn_health_checks=True,
                engine='django.db.backends.mysql'
            )
        }
    elif db_url:
        DATABASES = {
            'default': dj_database_url.config(
                default=db_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    else:
        # Fallback to sqlite if no DATABASE_URL is present (e.g. build step)
        # This prevents the "MySQLdb.OperationalError" when DATABASE_URL is missing
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
            }
        }

# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
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
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'portal': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache configuration (using Redis if available, otherwise local memory)
if os.getenv('REDIS_URL'):
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.getenv('REDIS_URL'),
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
