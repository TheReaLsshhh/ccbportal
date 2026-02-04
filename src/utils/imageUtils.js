/**
 * Utility function to normalize image URLs to work with backend
 * Images are served from Cloudinary or the backend (when using relative URLs)
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
  
  // If it's already an absolute URL with http/https, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const u = new URL(imageUrl);
      if (u.hostname.includes('res.cloudinary.com')) {
        const parts = u.pathname.split('/');
        const idx = parts.findIndex((p) => p === 'upload');
        if (idx !== -1) {
          const transform = 'f_auto,q_auto';
          const next = parts[idx + 1] || '';
          if (!next.includes('f_') && !next.includes('q_')) {
            parts.splice(idx + 1, 0, transform);
            u.pathname = parts.join('/');
            return u.toString();
          }
        }
      }
      return imageUrl;
    } catch (_) {
      return imageUrl;
    }
  }
  
  // Get backend URL from environment variable (without /api suffix for media files)
  let backendUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
  
  // In development, prefer localhost to ensure local testing works
  if (process.env.NODE_ENV === 'development') {
    backendUrl = 'http://localhost:5000';
  }

  const BACKEND_URL = backendUrl.replace(/\/$/, ''); // Remove trailing slash
  
  try {
    // If it's a relative URL (starts with /), prepend backend URL
    if (imageUrl.startsWith('/')) {
      return `${BACKEND_URL}${imageUrl}`;
    }
    
    // Otherwise, assume it's a path without leading slash and prepend backend + /
    return `${BACKEND_URL}/${imageUrl}`;
  } catch (error) {
    console.warn('Failed to parse image URL:', imageUrl, error);
    // Fallback: prepend backend URL
    return `${BACKEND_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
};

export const buildSrcSet = (url, widths = [320, 480, 768, 1024, 1280]) => {
  if (!url) return '';
  try {
    const u = new URL(normalizeImageUrl(url));
    if (!u.hostname.includes('res.cloudinary.com')) return '';
    return widths.map((w) => {
      const parts = u.pathname.split('/');
      const idx = parts.findIndex((p) => p === 'upload');
      if (idx === -1) return null;
      const t = 'f_auto,q_auto,c_limit,w_' + w;
      const next = parts[idx + 1] || '';
      const newParts = [...parts];
      if (next.includes('w_') || next.includes('c_') || next.includes('f_') || next.includes('q_')) {
        newParts[idx + 1] = t;
      } else {
        newParts.splice(idx + 1, 0, t);
      }
      const p = newParts.join('/');
      return `${u.origin}${p} ${w}w`;
    }).filter(Boolean).join(', ');
  } catch (_) {
    return '';
  }
};
