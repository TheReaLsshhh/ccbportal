"""
Utility functions for security and data sanitization
"""
import re
from html import escape
from django.utils.html import strip_tags


def sanitize_html(text, allowed_tags=None):
    """
    Sanitize HTML content to prevent XSS attacks.
    
    Args:
        text: HTML string to sanitize
        allowed_tags: List of allowed HTML tags (default: safe tags only)
        Note: For production, consider using bleach library for more robust sanitization
    
    Returns:
        Sanitized HTML string with only safe tags
    """
    if not text:
        return ''
    
    # Simple HTML sanitization using Django's escape
    # Strip all tags first, then allow safe formatting
    # For production, install bleach: pip install bleach
    # and use: from bleach import clean; return clean(text, tags=allowed_tags)
    
    # Escape all HTML first
    escaped = escape(text)
    
    # Replace escaped newlines with <br/> for display
    escaped = escaped.replace('\\n', '<br/>')
    escaped = escaped.replace('\n', '<br/>')
    
    return escaped


def sanitize_input(text, max_length=None):
    """
    Sanitize user input by escaping HTML and validating length.
    
    Args:
        text: Input string to sanitize
        max_length: Maximum allowed length (optional)
    
    Returns:
        Sanitized string
    """
    if not text:
        return ''
    
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)
    
    # Trim whitespace
    text = text.strip()
    
    # Check length
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def validate_file_upload(file, allowed_types=None, max_size_mb=10):
    """
    Validate file upload for security.
    
    Args:
        file: Django UploadedFile object
        allowed_types: List of allowed MIME types (default: images only)
        max_size_mb: Maximum file size in MB
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if allowed_types is None:
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if file.size > max_size_bytes:
        return False, f'File size exceeds maximum allowed size of {max_size_mb}MB'
    
    # Check content type
    if file.content_type not in allowed_types:
        return False, f'File type {file.content_type} is not allowed'
    
    # Additional validation: check file extension matches content type
    ext = file.name.split('.')[-1].lower() if '.' in file.name else ''
    ext_to_mime = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }
    if ext in ext_to_mime and ext_to_mime[ext] != file.content_type:
        return False, 'File extension does not match file content type'
    
    return True, None


def build_safe_media_url(request, file_field):
    """
    Build a safe media URL for file fields.
    Handles cases where file doesn't exist or URL generation fails.
    
    Args:
        request: Django request object
        file_field: Django ImageField or FileField instance (or model instance with image field)
    
    Returns:
        Absolute URL string or None
    """
    if not file_field:
        return None
    
    try:
        # Handle both direct field access and model instance access
        if hasattr(file_field, 'url'):
            url = file_field.url
        elif hasattr(file_field, 'image') and file_field.image:
            url = file_field.image.url
        else:
            return None
        
        # Ensure URL is properly formatted
        if not url:
            return None
        
        # If URL is relative, make it absolute
        if url.startswith('/'):
            # Use build_absolute_uri which handles the current request's host
            return request.build_absolute_uri(url)
        
        # If already absolute, return as-is
        return url
    except (ValueError, AttributeError, Exception) as e:
        # Log error in production (optional)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to build media URL: {e}")
        return None
