import React, { useState, useRef, useEffect } from 'react';
import { optimizeImageSrc, generateResponsiveSources, createLazyLoadObserver } from '../utils/ImageOptimizer';
import './OptimizedImage.css';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  sizes = '100vw',
  priority = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    const observer = createLazyLoadObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const optimizedSrc = optimizeImageSrc(src, { width, height });
  const responsiveSources = generateResponsiveSources(src);

  if (hasError) {
    return (
      <div className={`optimized-image-error ${className}`}>
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-container ${className} ${isLoaded ? 'loaded' : 'loading'}`}
    >
      {isInView && (
        <picture>
          {responsiveSources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              media={source.media}
              type="image/webp"
            />
          ))}
          <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : loading}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            style={{ opacity: isLoaded ? 1 : 0 }}
            {...props}
          />
        </picture>
      )}
      {!isLoaded && (
        <div className="image-placeholder">
          <div className="placeholder-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
