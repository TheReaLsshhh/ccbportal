/**
 * Cloudinary delivery (originals unchanged in storage):
 * - f_auto: AVIF or WebP (or best) per browser — usually smallest vs forcing one format
 * - q_auto:low: strongest automatic quality reduction (smaller files, still acceptable)
 * - fl_force_strip: strip metadata for extra bytes saved
 */
const CLOUDINARY_BASE_DELIVERY = 'f_auto,q_auto:low,fl_force_strip';

function isLikelyTransformSegment(seg) {
  if (!seg) return false;
  if (/^v\d+/.test(seg)) return false;
  return /(^|,)(f_|q_|c_|w_|fl_)/.test(seg);
}

function applyCloudinaryDeliveryTransform(pathname) {
  const parts = pathname.split('/');
  const idx = parts.findIndex((p) => p === 'upload');
  if (idx === -1) return pathname;

  const next = parts[idx + 1] || '';

  if (!isLikelyTransformSegment(next)) {
    parts.splice(idx + 1, 0, CLOUDINARY_BASE_DELIVERY);
    return parts.join('/');
  }

  if (!/w_\d+/.test(next)) {
    parts[idx + 1] = CLOUDINARY_BASE_DELIVERY;
    return parts.join('/');
  }

  let seg = next;
  seg = seg.replace(/\bf_webp\b/g, 'f_auto');
  if (!/\bf_auto\b/.test(seg)) seg = `f_auto,${seg}`;
  seg = seg.replace(/f_auto,f_auto/g, 'f_auto');
  seg = seg.replace(/\bq_auto:good\b|\bq_auto:eco\b|\bq_auto\b(?!:)/g, 'q_auto:low');
  seg = seg.replace(/\bq_auto:best\b/g, 'q_auto:low');
  if (!/\bfl_force_strip\b/.test(seg)) seg = `${seg},fl_force_strip`;
  parts[idx + 1] = seg;
  return parts.join('/');
}

/**
 * Normalize image URLs for the backend or Cloudinary.
 *
 * @param {string} imageUrl - From API (absolute Cloudinary, or relative /media/...)
 * @returns {string|null}
 */
export const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const u = new URL(imageUrl);
      if (u.hostname.includes('res.cloudinary.com')) {
        u.pathname = applyCloudinaryDeliveryTransform(u.pathname);
        return u.toString();
      }
      return imageUrl;
    } catch (_) {
      return imageUrl;
    }
  }

  let backendUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  if (process.env.NODE_ENV === 'development') {
    backendUrl = 'http://localhost:5000';
  }

  const BACKEND_URL = backendUrl.replace(/\/$/, '');

  try {
    if (imageUrl.startsWith('/')) {
      return `${BACKEND_URL}${imageUrl}`;
    }

    return `${BACKEND_URL}/${imageUrl}`;
  } catch (error) {
    console.warn('Failed to parse image URL:', imageUrl, error);
    return `${BACKEND_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }
};

export const buildSrcSet = (url, widths = [320, 480, 640, 768, 1024]) => {
  if (!url) return '';
  try {
    const u = new URL(normalizeImageUrl(url));
    if (!u.hostname.includes('res.cloudinary.com')) return '';
    return widths
      .map((w) => {
        const parts = u.pathname.split('/');
        const idx = parts.findIndex((p) => p === 'upload');
        if (idx === -1) return null;
        const t = `f_auto,q_auto:low,fl_force_strip,c_limit,w_${w}`;
        const next = parts[idx + 1] || '';
        const newParts = [...parts];
        if (next.includes('w_') || next.includes('c_') || next.includes('f_') || next.includes('q_') || next.includes('fl_')) {
          newParts[idx + 1] = t;
        } else {
          newParts.splice(idx + 1, 0, t);
        }
        const p = newParts.join('/');
        return `${u.origin}${p} ${w}w`;
      })
      .filter(Boolean)
      .join(', ');
  } catch (_) {
    return '';
  }
};
