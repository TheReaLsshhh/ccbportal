# Security Configuration Guide

This document outlines the security measures implemented in the CCB Portal application and how to configure them properly.

## Environment Variables

For production deployment, you MUST set the following environment variables:

### Required Environment Variables

```bash
# Django Secret Key (CRITICAL - Generate a new random key for production)
DJANGO_SECRET_KEY=your-secret-key-here

# Django Debug Mode (set to False in production)
DJANGO_DEBUG=False

# Allowed Hosts (comma-separated list of domain names)
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# CORS Allowed Origins (comma-separated list of allowed origins)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DB_NAME=ccb_portal
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
```

### Optional Environment Variables

```bash
# Email Configuration (Brevo/Sendinblue)
BREVO_API_KEY=your-brevo-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
SERVER_EMAIL=noreply@yourdomain.com

# SMTP Fallback (if not using Brevo)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password

# SSL Settings (for production with HTTPS)
SECURE_SSL_REDIRECT=True
```

## Security Features Implemented

### 1. Input Sanitization

All user inputs are sanitized to prevent:
- SQL Injection (handled by Django ORM - uses parameterized queries)
- XSS (Cross-Site Scripting) attacks
- Code injection

**Backend**: Uses `sanitize_input()` utility function in `portal/utils.py`
**Frontend**: Uses HTML escaping for all user-generated content

### 2. File Upload Security

Image uploads are validated for:
- File type (only images: JPEG, PNG, GIF, WebP)
- File size (maximum 10MB)
- File extension matches content type

### 3. CSRF Protection

- CSRF middleware is enabled in Django settings
- API endpoints use `@csrf_exempt` decorator because they use session-based authentication with cookies
- All API endpoints require `@login_required` decorator for authentication
- Frontend includes credentials (cookies) in all API requests

### 4. Authentication & Authorization

- All admin endpoints require login (`@login_required`)
- Permission checks using Django's permission system (`@permission_required`)
- Session-based authentication with secure cookies in production

### 5. Security Headers (Production)

When `DEBUG=False`, the following security headers are enabled:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Can be added for additional protection

### 6. CORS Configuration

- Development: Allows all origins (for local testing)
- Production: Restricted to specific allowed origins via `CORS_ALLOWED_ORIGINS`

### 7. Database Security

- Uses Django ORM which prevents SQL injection through parameterized queries
- SQL mode set to `STRICT_TRANS_TABLES` to prevent invalid data
- No raw SQL queries without proper sanitization

## Image Upload/Display Security

Images are validated before upload and URLs are safely generated:
- File type validation
- File size limits
- Safe URL generation using `build_safe_media_url()` utility
- Media files served with proper content types

## HTML Content Sanitization

Rich text content (like core_values, descriptions) is sanitized:
- HTML tags are escaped by default
- Only safe formatting is preserved (line breaks)
- For production, consider using DOMPurify library on frontend

## Production Deployment Checklist

- [ ] Set `DJANGO_SECRET_KEY` to a secure random value
- [ ] Set `DJANGO_DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Configure `CORS_ALLOWED_ORIGINS` with your frontend URL(s)
- [ ] Enable HTTPS and set `SECURE_SSL_REDIRECT=True`
- [ ] Configure secure database credentials
- [ ] Set up proper file permissions for media directory
- [ ] Configure web server (nginx/apache) to serve static/media files
- [ ] Set up regular backups
- [ ] Enable logging and monitoring
- [ ] Review and update dependencies regularly
- [ ] Set up rate limiting for API endpoints (consider django-ratelimit)

## Known Security Considerations

1. **@csrf_exempt on API endpoints**: This is acceptable for session-based authentication but ensure:
   - All endpoints require authentication
   - Proper permission checks are in place
   - Consider adding rate limiting

2. **HTML Content**: Some fields allow HTML content (core_values). Currently uses basic escaping. For production, consider:
   - Installing and using `bleach` library for robust HTML sanitization
   - Or using DOMPurify on the frontend

3. **File Uploads**: Currently allows images up to 10MB. Consider:
   - Adding virus scanning
   - Adding image optimization
   - Setting up CDN for media files

## Generating a Secure Secret Key

To generate a new Django secret key:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or use:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Additional Recommendations

1. **Rate Limiting**: Install `django-ratelimit` to prevent brute force attacks
2. **Logging**: Set up proper logging for security events
3. **Monitoring**: Use tools like Sentry for error tracking
4. **Backups**: Regular database and media file backups
5. **Updates**: Keep Django and dependencies updated
6. **Security Headers**: Consider adding Content-Security-Policy header
