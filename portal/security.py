"""
Security utilities for admin panel protection
Includes rate limiting, account lockout, and audit logging
"""
import time
from datetime import datetime, timedelta
from django.core.cache import cache
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)

# Rate limiting configuration
MAX_LOGIN_ATTEMPTS = 5  # Maximum failed login attempts
LOCKOUT_DURATION = 900  # 15 minutes in seconds
RATE_LIMIT_WINDOW = 60  # 1 minute window for rate limiting
MAX_REQUESTS_PER_WINDOW = 10  # Max requests per window

# Session configuration
SESSION_TIMEOUT = 1800  # 30 minutes in seconds
SESSION_WARNING_TIME = 300  # 5 minutes before timeout


def get_client_ip(request):
    """Extract client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    return ip


def is_account_locked(username, ip_address=None):
    """
    Check if an account is locked due to too many failed login attempts
    
    Args:
        username: Username to check
        ip_address: Optional IP address for IP-based lockout
    
    Returns:
        tuple: (is_locked, remaining_time_seconds, lockout_key)
    """
    # Check username-based lockout
    username_key = f'login_lockout_{username}'
    lockout_data = cache.get(username_key)
    
    if lockout_data:
        lockout_time, attempts = lockout_data
        elapsed = time.time() - lockout_time
        if elapsed < LOCKOUT_DURATION:
            remaining = int(LOCKOUT_DURATION - elapsed)
            return True, remaining, username_key
    
    # Check IP-based lockout if IP provided
    if ip_address:
        ip_key = f'login_lockout_ip_{ip_address}'
        ip_lockout_data = cache.get(ip_key)
        
        if ip_lockout_data:
            lockout_time, attempts = ip_lockout_data
            elapsed = time.time() - lockout_time
            if elapsed < LOCKOUT_DURATION:
                remaining = int(LOCKOUT_DURATION - elapsed)
                return True, remaining, ip_key
    
    return False, 0, None


def record_failed_login(username, ip_address=None):
    """
    Record a failed login attempt and lock account if threshold reached
    
    Args:
        username: Username that failed login
        ip_address: Optional IP address
    
    Returns:
        tuple: (is_locked, remaining_time_seconds)
    """
    # Track username-based attempts
    username_key = f'login_attempts_{username}'
    attempts = cache.get(username_key, 0) + 1
    
    if attempts >= MAX_LOGIN_ATTEMPTS:
        # Lock the account
        lockout_key = f'login_lockout_{username}'
        cache.set(lockout_key, (time.time(), attempts), LOCKOUT_DURATION)
        cache.delete(username_key)
        logger.warning(f'Account locked: {username} after {attempts} failed attempts')
        return True, LOCKOUT_DURATION
    else:
        # Increment attempt counter (expires after lockout duration)
        cache.set(username_key, attempts, LOCKOUT_DURATION)
        return False, 0
    
    # Track IP-based attempts if IP provided
    if ip_address:
        ip_key = f'login_attempts_ip_{ip_address}'
        ip_attempts = cache.get(ip_key, 0) + 1
        
        if ip_attempts >= MAX_LOGIN_ATTEMPTS:
            ip_lockout_key = f'login_lockout_ip_{ip_address}'
            cache.set(ip_lockout_key, (time.time(), ip_attempts), LOCKOUT_DURATION)
            cache.delete(ip_key)
            logger.warning(f'IP locked: {ip_address} after {ip_attempts} failed attempts')
            return True, LOCKOUT_DURATION
        else:
            cache.set(ip_key, ip_attempts, LOCKOUT_DURATION)


def clear_login_attempts(username, ip_address=None):
    """Clear failed login attempts after successful login"""
    username_key = f'login_attempts_{username}'
    lockout_key = f'login_lockout_{username}'
    cache.delete(username_key)
    cache.delete(lockout_key)
    
    if ip_address:
        ip_key = f'login_attempts_ip_{ip_address}'
        ip_lockout_key = f'login_lockout_ip_{ip_address}'
        cache.delete(ip_key)
        cache.delete(ip_lockout_key)


def check_rate_limit(identifier, max_requests=MAX_REQUESTS_PER_WINDOW, window=RATE_LIMIT_WINDOW):
    """
    Check if request exceeds rate limit
    
    Args:
        identifier: Unique identifier (IP, user ID, etc.)
        max_requests: Maximum requests allowed
        window: Time window in seconds
    
    Returns:
        tuple: (is_allowed, remaining_requests, reset_time)
    """
    key = f'rate_limit_{identifier}'
    current = cache.get(key, 0)
    
    if current >= max_requests:
        # Get TTL to know when limit resets
        ttl = cache.ttl(key)
        return False, 0, ttl if ttl else window
    
    # Increment counter
    cache.set(key, current + 1, window)
    return True, max_requests - current - 1, window


def log_admin_action(user, action, resource_type, resource_id=None, details=None, ip_address=None):
    """
    Log admin actions for audit trail
    
    Args:
        user: User object
        action: Action performed (create, update, delete, login, logout, etc.)
        resource_type: Type of resource (announcement, event, etc.)
        resource_id: ID of the resource (optional)
        details: Additional details (optional)
        ip_address: IP address of the user (optional)
    """
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'user_id': user.id,
        'username': user.username,
        'action': action,
        'resource_type': resource_type,
        'resource_id': resource_id,
        'details': details,
        'ip_address': ip_address,
    }
    
    # Log to Django logger
    logger.info(f'Admin Action: {user.username} - {action} - {resource_type} - {resource_id}', extra=log_entry)
    
    # Store in cache for recent activity (last 1000 actions)
    # In production, consider storing in database or external logging service
    activity_key = f'admin_activity_{user.id}_{int(time.time())}'
    cache.set(activity_key, log_entry, 86400)  # Keep for 24 hours


def sanitize_input(value, max_length=None):
    """
    Enhanced input sanitization
    
    Args:
        value: Input value to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized value
    """
    if value is None:
        return None
    
    if isinstance(value, (int, float, bool)):
        return value
    
    # Convert to string
    value = str(value)
    
    # Remove null bytes and control characters
    import re
    value = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', value)
    
    # Trim whitespace
    value = value.strip()
    
    # Check length
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value


def validate_request_size(request, max_size_mb=10):
    """
    Validate request body size to prevent DoS attacks
    
    Args:
        request: Django request object
        max_size_mb: Maximum allowed size in MB
    
    Returns:
        tuple: (is_valid, error_message)
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    
    # Check Content-Length header
    content_length = request.META.get('CONTENT_LENGTH')
    if content_length:
        try:
            size = int(content_length)
            if size > max_size_bytes:
                return False, f'Request body too large. Maximum allowed: {max_size_mb}MB'
        except ValueError:
            pass
    
    return True, None


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful user login"""
    ip_address = get_client_ip(request)
    log_admin_action(user, 'login', 'authentication', ip_address=ip_address)
    clear_login_attempts(user.username, ip_address)


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if user:
        ip_address = get_client_ip(request)
        log_admin_action(user, 'logout', 'authentication', ip_address=ip_address)

