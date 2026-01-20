# Production settings override for Render deployment
import os
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary_storage.storage import MediaCloudinaryStorage
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

# Cloudinary configuration for media files (persistent storage on free tier)
# Get credentials from environment variables (set in Render dashboard)
cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY', '')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET', '')

if cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
    cloudinary.config(
        cloud_name=cloudinary_cloud_name,
        api_key=cloudinary_api_key,
        api_secret=cloudinary_api_secret,
        secure=True
    )
    # Use Cloudinary for media file storage (persists across deployments)
    MEDIA_URL = f'https://res.cloudinary.com/{cloudinary_cloud_name}/image/upload/'
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    # Fallback to local storage if Cloudinary not configured
    MEDIA_URL = '/media/'
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Keep MEDIA_ROOT for backward compatibility
MEDIA_ROOT = BASE_DIR / 'media'

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
# Cloudinary serves images via CDN, so CORS is handled by Cloudinary
# Allow requests from any origin for API endpoints
CORS_URLS_REGEX = r'^/api/.*$'