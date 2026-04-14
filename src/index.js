import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initPerformanceMonitor } from './utils/PerformanceMonitor';
import { trackSEOPerformance } from './utils/SEOEnhancer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      cacheTime: 600000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize performance monitoring
if (process.env.NODE_ENV === 'production') {
  initPerformanceMonitor();
  trackSEOPerformance();
}

// Service Worker Registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              if (window.confirm('New content available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Preload critical resources
const preloadCriticalResources = () => {
  const criticalResources = [
    '/images/ccb.c0ca0ca63b3fdc15330b.jpg',
    '/images/bg.png'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = resource;
    document.head.appendChild(link);
  });
};

// Optimize font loading
const optimizeFontLoading = () => {
  if ('fonts' in document) {
    // Load fonts asynchronously
    Promise.all([
      document.fonts.load('400 1em Segoe UI'),
      document.fonts.load('600 1em Segoe UI'),
      document.fonts.load('700 1em Segoe UI')
    ]).then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
};

// Prevent browser from restoring scroll position on reload/refresh and start at top
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  preloadCriticalResources();
  optimizeFontLoading();
});

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Performance optimizations
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload non-critical resources during idle time
    const nonCriticalResources = [
      '/images/fblogo.png'
    ];
    
    nonCriticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
