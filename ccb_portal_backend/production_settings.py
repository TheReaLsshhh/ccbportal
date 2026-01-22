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
# Support both CLOUDINARY_URL and individual components

cloudinary_url = os.getenv('CLOUDINARY_URL')
cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')

print(f"\n[CLOUDINARY CONFIG] Starting Cloudinary configuration...")
print(f"[CLOUDINARY CONFIG] CLOUDINARY_URL present: {bool(cloudinary_url)}")
print(f"[CLOUDINARY CONFIG] CLOUDINARY_CLOUD_NAME present: {bool(cloudinary_cloud_name)}")

# If CLOUDINARY_URL is set, parse it (takes precedence)
if cloudinary_url:
    try:
        import urllib.parse
        # CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
        parsed = urllib.parse.urlparse(cloudinary_url)
        if parsed.hostname:
            cloudinary_cloud_name = parsed.hostname
            print(f"[CLOUDINARY CONFIG] Parsed cloud_name from CLOUDINARY_URL: {cloudinary_cloud_name}")
        if parsed.username:
            cloudinary_api_key = parsed.username
            print(f"[CLOUDINARY CONFIG] Parsed api_key from CLOUDINARY_URL: SET")
        if parsed.password:
            cloudinary_api_secret = parsed.password
            print(f"[CLOUDINARY CONFIG] Parsed api_secret from CLOUDINARY_URL: SET")
    except Exception as e:
        print(f"[CLOUDINARY ERROR] Failed to parse CLOUDINARY_URL: {e}")

# Final validation
print(f"\n[CLOUDINARY CONFIG] Final configuration check:")
print(f"[CLOUDINARY CONFIG] Cloud Name: {cloudinary_cloud_name if cloudinary_cloud_name else 'NOT SET'}")
print(f"[CLOUDINARY CONFIG] API Key: {'SET' if cloudinary_api_key else 'NOT SET'}")
print(f"[CLOUDINARY CONFIG] API Secret: {'SET' if cloudinary_api_secret else 'NOT SET'}")

# FORCE Cloudinary storage in production, regardless of configuration status
# If credentials are missing, uploads will fail (which is better than silently using local disk)
if cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
    print(f"\n[CLOUDINARY SUCCESS] Configuring Cloudinary with all credentials present")
    cloudinary.config(
        cloud_name=cloudinary_cloud_name,
        api_key=cloudinary_api_key,
        api_secret=cloudinary_api_secret,
        secure=True
    )
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    print(f"[CLOUDINARY SUCCESS] ✓ DEFAULT_FILE_STORAGE = MediaCloudinaryStorage")
    print(f"[CLOUDINARY SUCCESS] ✓ Images will be uploaded to Cloudinary CDN")
else:
    print(f"\n[CLOUDINARY ERROR] MISSING CREDENTIALS - Setting to FileSystemStorage as fallback")
    print(f"[CLOUDINARY ERROR] This is a MISCONFIGURATION - files will be lost on redeploy!")
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Media URL configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

print(f"\n[CLOUDINARY CONFIG] MEDIA_URL = {MEDIA_URL}")
print(f"[CLOUDINARY CONFIG] MEDIA_ROOT = {MEDIA_ROOT}")
print(f"[CLOUDINARY CONFIG] Configuration complete.\n")

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