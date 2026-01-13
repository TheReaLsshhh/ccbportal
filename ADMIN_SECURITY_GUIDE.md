# Admin Panel Security Enhancements

This document outlines the comprehensive security improvements implemented for the admin panel to protect against SQL injection, brute force attacks, and other vulnerabilities.

## Security Features Implemented

### 1. Rate Limiting
- **Login Endpoint**: Limited to 5 attempts per minute per IP address
- **Prevents**: Brute force attacks, credential stuffing
- **Implementation**: Uses Django cache to track request rates

### 2. Account Lockout
- **Threshold**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Scope**: Both username-based and IP-based lockout
- **Prevents**: Brute force attacks, automated password guessing

### 3. Session Management
- **Session Timeout**: 30 minutes of inactivity
- **Session Warning**: 5 minutes before expiry
- **Storage**: Uses `sessionStorage` instead of `localStorage` (cleared when tab closes)
- **Auto-logout**: Automatic logout when session expires
- **Prevents**: Session hijacking, unauthorized access to abandoned sessions

### 4. Input Validation & Sanitization

#### Backend
- All user inputs are sanitized using `sanitize_input()` function
- Removes null bytes, control characters
- Length validation
- Request size limits (1MB for login, 10MB for file uploads)

#### Frontend
- Real-time input sanitization
- Length validation
- Character filtering
- Prevents: XSS attacks, injection attacks, buffer overflows

### 5. SQL Injection Protection
- **Already Protected**: Django ORM uses parameterized queries by default
- **No Raw SQL**: All database operations use Django ORM
- **SQL Mode**: Strict mode enabled in MySQL configuration
- **Prevents**: SQL injection attacks

### 6. Audit Logging
- All admin actions are logged (login, logout, create, update, delete)
- Logs include: user, action, resource type, IP address, timestamp
- Stored in Django logs and cache (24 hours)
- **Prevents**: Unauthorized actions, provides audit trail

### 7. Request Size Limits
- Login requests: 1MB maximum
- File uploads: 10MB maximum
- **Prevents**: DoS attacks, memory exhaustion

### 8. Enhanced Error Handling
- Generic error messages (don't reveal system details)
- Proper HTTP status codes
- Rate limit and lockout information in responses
- **Prevents**: Information disclosure

## Configuration

### Security Settings (portal/security.py)

```python
MAX_LOGIN_ATTEMPTS = 5  # Maximum failed login attempts
LOCKOUT_DURATION = 900  # 15 minutes in seconds
RATE_LIMIT_WINDOW = 60  # 1 minute window
MAX_REQUESTS_PER_WINDOW = 10  # Max requests per window
SESSION_TIMEOUT = 1800  # 30 minutes in seconds
SESSION_WARNING_TIME = 300  # 5 minutes before timeout
```

### Django Settings (ccb_portal_backend/settings.py)

The following security settings are already configured:
- `SESSION_COOKIE_SECURE = True` (production)
- `SESSION_COOKIE_HTTPONLY = True`
- `CSRF_COOKIE_SECURE = True` (production)
- `CSRF_COOKIE_HTTPONLY = True`
- `SECURE_HSTS_SECONDS = 31536000` (production)
- `X_FRAME_OPTIONS = 'DENY'` (production)

## Usage

### For Administrators

1. **Login**: 
   - Enter username and password
   - After 5 failed attempts, account is locked for 15 minutes
   - Rate limiting: Maximum 5 login attempts per minute

2. **Session Management**:
   - Session expires after 30 minutes of inactivity
   - Warning appears 5 minutes before expiry
   - Save your work regularly

3. **Security Best Practices**:
   - Use strong passwords
   - Don't share credentials
   - Log out when finished
   - Don't leave admin panel open on shared computers

### For Developers

#### Adding Audit Logging to New Endpoints

```python
from portal.security import log_admin_action, get_client_ip

@login_required_json
def api_admin_create_item(request):
    # ... create logic ...
    
    # Log the action
    log_admin_action(
        user=request.user,
        action='create',
        resource_type='item',
        resource_id=new_item.id,
        details={'title': new_item.title},
        ip_address=get_client_ip(request)
    )
```

#### Adding Input Sanitization

```python
from portal.security import sanitize_input

def my_view(request):
    data = json.loads(request.body)
    title = sanitize_input(data.get('title', ''), max_length=200)
    # ... use sanitized title ...
```

## Security Checklist

### Before Production Deployment

- [ ] Set `DJANGO_DEBUG=False`
- [ ] Set strong `DJANGO_SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Enable HTTPS (`SECURE_SSL_REDIRECT=True`)
- [ ] Set up proper database credentials
- [ ] Configure email for security alerts
- [ ] Set up monitoring and alerting
- [ ] Review and test all security features
- [ ] Set up regular security audits

### Regular Maintenance

- [ ] Review audit logs weekly
- [ ] Monitor failed login attempts
- [ ] Check for suspicious activity
- [ ] Update dependencies regularly
- [ ] Review and update security settings
- [ ] Test backup and recovery procedures

## Additional Security Recommendations

### High Priority
1. **Two-Factor Authentication (2FA)**: Implement 2FA for admin accounts
2. **IP Whitelisting**: Optionally restrict admin access to specific IPs
3. **Password Policy**: Enforce strong password requirements
4. **Regular Security Audits**: Schedule periodic security reviews

### Medium Priority
1. **Content Security Policy (CSP)**: Add CSP headers
2. **Database Encryption**: Encrypt sensitive data at rest
3. **Backup Encryption**: Encrypt backups
4. **Intrusion Detection**: Set up monitoring for suspicious activity

### Nice to Have
1. **Security Headers**: Add additional security headers
2. **Penetration Testing**: Regular penetration testing
3. **Vulnerability Scanning**: Automated vulnerability scanning
4. **Security Training**: Train administrators on security best practices

## Troubleshooting

### Account Locked
- Wait 15 minutes for automatic unlock
- Contact system administrator if needed
- Check if IP address is blocked

### Session Expired
- Log in again
- Save work more frequently
- Session expires after 30 minutes of inactivity

### Rate Limited
- Wait 1 minute before trying again
- Reduce number of requests
- Contact administrator if persistent

## Support

For security concerns or issues:
1. Review audit logs
2. Check Django logs
3. Contact system administrator
4. Report security vulnerabilities responsibly

## References

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Best Practices](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

