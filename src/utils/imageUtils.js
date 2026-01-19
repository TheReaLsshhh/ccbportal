/**
 * Utility function to normalize image URLs to work with backend
 * Images are served from Django backend, not the static frontend
 * 
 * @param {string} imageUrl - The image URL from the backend (can be absolute or relative)
 * @returns {string} - Normalized URL pointing to backend
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a data URL or blob URL, return as is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  
  // Get backend URL from environment variable (without /api suffix for media files)
  const backendUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const BACKEND_URL = backendUrl.replace(/\/$/, ''); // Remove trailing slash
  
  try {
    // If it's a relative URL (starts with /), prepend backend URL
    if (imageUrl.startsWith('/')) {
      return `${BACKEND_URL}${imageUrl}`;
    }
    
    // If it's already an absolute URL with http/https, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Otherwise, assume it's a path without leading slash and prepend backend + /
    return `${BACKEND_URL}/${imageUrl}`;
  } catch (error) {
    console.warn('Failed to parse image URL:', imageUrl, error);
    // Fallback: prepend backend URL
    return `${BACKEND_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
};