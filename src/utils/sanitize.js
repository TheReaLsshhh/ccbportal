/**
 * Frontend HTML sanitization utility to prevent XSS attacks
 */

/**
 * Sanitize HTML string by escaping dangerous content
 * For production, consider using DOMPurify library
 * 
 * @param {string} html - HTML string to sanitize
 * @param {Array<string>} allowedTags - Optional list of allowed tags (default: safe tags)
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHTML(html, allowedTags = null) {
  if (!html) return '';

  // Simple sanitization: escape HTML entities
  // For production, use: import DOMPurify from 'dompurify'; return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags || ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'] });
  
  const div = document.createElement('div');
  div.textContent = html;
  let sanitized = div.innerHTML;
  
  // Replace newlines with <br/> for display
  sanitized = sanitized.replace(/\n/g, '<br/>');
  
  return sanitized;
}

/**
 * Sanitize user input by removing potentially dangerous characters
 * 
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input, maxLength = null) {
  if (!input) return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Check length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Escape HTML to prevent XSS when displaying user content
 * 
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML string
 */
export function escapeHTML(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
