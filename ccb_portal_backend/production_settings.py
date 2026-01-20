# Production settings override for Render deployment
import os
import dj_database_url
from .settings import *

# SECURITY: Override with production values
DEBUG = False

# Parse ALLOWED_HOSTS from environment variable
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Database: PostgreSQL on Render
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# CORS: Allow frontend domain
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-http-method-override',
]

# Static and Media files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Ensure WhiteNoise handles static files properly
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Additional CORS settings for media files
# Allow requests from any origin for media files (images are public content)
# This is necessary because browsers may request images directly
CORS_URLS_REGEX = r'^/(api|media)/.*$'

# Ensure proper content type headers for media files
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'