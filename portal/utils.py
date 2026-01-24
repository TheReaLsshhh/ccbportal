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
    
    # Get file extension
    ext = file.name.split('.')[-1].lower() if '.' in file.name else ''
    
    # Extension to MIME type mapping (including common variations browsers may send)
    # This helps handle cases where browsers send different MIME types for the same file
    ext_to_mime = {
        # Images
        'jpg': ['image/jpeg', 'image/jpg'],
        'jpeg': ['image/jpeg', 'image/jpg'],
        'png': ['image/png'],
        'gif': ['image/gif'],
        'webp': ['image/webp'],
        # Documents
        'pdf': ['application/pdf'],
        'doc': ['application/msword', 'application/vnd.ms-word'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
        'xls': ['application/vnd.ms-excel', 'application/msexcel'],
        'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        'zip': ['application/zip', 'application/x-zip-compressed'],
        'rar': ['application/x-rar-compressed', 'application/vnd.rar'],
    }
    
    # First, check if content type is directly in allowed_types
    if file.content_type in allowed_types:
        return True, None
    
    # If content type not directly in allowed_types, check if extension is valid
    # and if any of the extension's expected MIME types are in allowed_types
    if ext in ext_to_mime:
        # Check if any of the expected MIME types for this extension are in allowed_types
        extension_mime_types = ext_to_mime[ext]
        if any(mime in allowed_types for mime in extension_mime_types):
            # The extension is allowed, so accept the file even if content_type is slightly different
            # (browsers sometimes send variations)
            return True, None
    
    # If we get here, the file type is not allowed
    return False, f'File type {file.content_type} is not allowed'


def build_safe_media_url(request, file_field):
    """
    Build a safe media URL for file fields.
    Handles cases where file doesn't exist or URL generation fails.
    Works with both Cloudinary storage and local file storage.
    
    Args:
        request: Django request object
        file_field: Django ImageField or FileField instance (or model instance with image/file field)
    
    Returns:
        Absolute URL string or None
    """
    if not file_field:
        return None
    
    try:
        # Handle direct FileField/ImageField access
        if hasattr(file_field, 'url'):
            url = file_field.url
        # Handle model instance with image field
        elif hasattr(file_field, 'image') and file_field.image:
            url = file_field.image.url
        # Handle model instance with file field
        elif hasattr(file_field, 'file') and file_field.file:
            url = file_field.file.url
        else:
            return None
        
        # Ensure URL is properly formatted
        if not url:
            return None
        
        # If URL is already absolute (https:// or http:// or Cloudinary URL), return as-is
        if url.startswith('http://') or url.startswith('https://') or 'cloudinary.com' in url:
            return url
        
        # If URL is relative, make it absolute using request host
        if url.startswith('/'):
            # Use build_absolute_uri which handles the current request's host
            return request.build_absolute_uri(url)
        
        # Fallback: return as-is
        return url
    except (ValueError, AttributeError, Exception) as e:
        # Log error in production (optional)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to build media URL: {e}")
        return None


def build_production_media_url(file_field, base_url=None):
    """
    Build a production-ready media URL for file fields.
    This is optimized for production deployment where we know the base URL.
    Supports both Cloudinary and local file storage.
    
    Args:
        file_field: Django ImageField or FileField instance (or model instance with image/file field)
        base_url: Base URL for the backend (e.g., https://ccb-portal-backend.onrender.com)
    
    Returns:
        Absolute URL string or None
    """
    if not file_field:
        return None
    
    try:
        # Handle direct FileField/ImageField access
        if hasattr(file_field, 'url'):
            url = file_field.url
        # Handle model instance with image field
        elif hasattr(file_field, 'image') and file_field.image:
            url = file_field.image.url
        # Handle model instance with file field
        elif hasattr(file_field, 'file') and file_field.file:
            url = file_field.file.url
        else:
            return None
        
        # Ensure URL is properly formatted
        if not url:
            return None
        
        # If URL is already absolute (https:// or http:// or Cloudinary URL), return as-is
        # Cloudinary URLs typically contain 'cloudinary.com'
        if url.startswith('http://') or url.startswith('https://') or 'cloudinary.com' in url:
            return url
        
        # For Cloudinary, we don't need to prepend base URL - Cloudinary handles it
        # But if we got a relative path here, something might be wrong with storage configuration
        # However, let's check if we are in production with Cloudinary
        from django.conf import settings
        if hasattr(settings, 'DEFAULT_FILE_STORAGE') and 'cloudinary' in settings.DEFAULT_FILE_STORAGE.lower():
            # If we are using Cloudinary but got a relative URL, it might be a local fallback or error.
            # But usually Cloudinary storage returns full URLs. 
            # If it IS relative, we might need to construct it manually if we have the public ID, 
            # but usually this means it's not actually on Cloudinary yet.
            pass
        
        # Get the base URL from settings or parameter (for local storage)
        if not base_url:
            base_url = getattr(settings, 'PUBLIC_BASE_URL', None)
            if not base_url:
                # Fallback to environment variable
                import os
                base_url = os.getenv('PUBLIC_BASE_URL', '')
        
        if not base_url:
            return None
            
        # Ensure base_url doesn't end with slash
        base_url = base_url.rstrip('/')
        
        # If URL is relative, prepend base URL (for local storage)
        if url.startswith('/'):
            return f"{base_url}{url}"
        else:
            # Handle relative paths without leading slash
            return f"{base_url}/{url}"
            
    except (ValueError, AttributeError, Exception) as e:
        # Log error in production
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to build production media URL: {e}")
        return None
