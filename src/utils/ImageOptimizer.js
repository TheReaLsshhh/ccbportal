// Image optimization utilities
export const optimizeImageSrc = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto'
  } = options;

  // If it's already an external URL, return as is
  if (src.startsWith('http')) {
    return src;
  }

  // For local images, we can add optimization parameters
  const baseUrl = src.split('?')[0];
  const params = new URLSearchParams();

  if (width) params.append('w', width);
  if (height) params.append('h', height);
  params.append('q', quality);
  params.append('f', format);

  const paramString = params.toString();
  return paramString ? `${baseUrl}?${paramString}` : baseUrl;
};

// Generate responsive image sources
export const generateResponsiveSources = (baseSrc, breakpoints = [320, 768, 1024, 1200]) => {
  return breakpoints.map(width => ({
    srcSet: `${optimizeImageSrc(baseSrc, { width })} ${width}w`,
    media: `(max-width: ${width}px)`
  }));
};

// Lazy loading with intersection observer
export const createLazyLoadObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  const observerOptions = { ...defaultOptions, ...options };

  return new IntersectionObserver(callback, observerOptions);
};

// Preload critical images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// WebP format detection
export const supportsWebP = () => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};
