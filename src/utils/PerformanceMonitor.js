// Core Web Vitals and Performance Monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = new Map();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.init();
    }
  }

  checkSupport() {
    return (
      'performance' in window &&
      'PerformanceObserver' in window &&
      'PerformanceNavigationTiming' in window
    );
  }

  init() {
    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  // Largest Contentful Paint
  observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.metrics.LCP = {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName || 'unknown',
        url: lastEntry.url || '',
        timestamp: Date.now()
      };

      this.reportMetric('LCP', this.metrics.LCP);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('LCP', observer);
  }

  // First Input Delay
  observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      
      this.metrics.FID = {
        value: firstEntry.processingStart - firstEntry.startTime,
        inputType: firstEntry.name,
        timestamp: Date.now()
      };

      this.reportMetric('FID', this.metrics.FID);
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('FID', observer);
  }

  // Cumulative Layout Shift
  observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.metrics.CLS = {
        value: clsValue,
        timestamp: Date.now()
      };

      this.reportMetric('CLS', this.metrics.CLS);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('CLS', observer);
  }

  // First Contentful Paint
  observeFCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        this.metrics.FCP = {
          value: fcpEntry.startTime,
          timestamp: Date.now()
        };

        this.reportMetric('FCP', this.metrics.FCP);
      }
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('FCP', observer);
  }

  // Time to First Byte
  observeTTFB() {
    if (!('PerformanceNavigationTiming' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      this.metrics.TTFB = {
        value: navigation.responseStart - navigation.requestStart,
        timestamp: Date.now()
      };

      this.reportMetric('TTFB', this.metrics.TTFB);
    }
  }

  // Resource loading performance
  observeResources() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const resources = entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize || 0,
        type: this.getResourceType(entry.name)
      }));

      this.metrics.resources = resources;
      this.reportMetric('resources', resources);
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resources', observer);
  }

  // Long tasks monitoring
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const longTasks = entries.map(entry => ({
        duration: entry.duration,
        startTime: entry.startTime,
        attribution: entry.attribution || []
      }));

      this.metrics.longTasks = longTasks;
      this.reportMetric('longTasks', longTasks);
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.set('longTasks', observer);
  }

  getResourceType(url) {
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  reportMetric(name, data) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric - ${name}:`, data);
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, data);
    }

    // Store for local analysis
    this.storeMetric(name, data);
  }

  sendToAnalytics(name, data) {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        name: name,
        value: Math.round(name === 'CLS' ? data.value * 1000 : data.value),
        event_category: 'Web Vitals',
        non_interaction: true
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: name,
        data: data,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silently fail to not affect user experience
    });
  }

  storeMetric(name, data) {
    const stored = localStorage.getItem('ccb_performance_metrics');
    const metrics = stored ? JSON.parse(stored) : {};
    
    metrics[name] = {
      ...data,
      recordedAt: Date.now()
    };
    
    // Keep only last 100 records
    const keys = Object.keys(metrics);
    if (keys.length > 100) {
      keys.slice(0, -100).forEach(key => delete metrics[key]);
    }
    
    localStorage.setItem('ccb_performance_metrics', JSON.stringify(metrics));
  }

  // Get performance score
  getPerformanceScore() {
    const scores = {
      LCP: this.getLCPScore(this.metrics.LCP?.value || 0),
      FID: this.getFIDScore(this.metrics.FID?.value || 0),
      CLS: this.getCLSScore(this.metrics.CLS?.value || 0),
      FCP: this.getFCPScore(this.metrics.FCP?.value || 0),
      TTFB: this.getTTFBScore(this.metrics.TTFB?.value || 0)
    };

    const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      individual: scores,
      overall: Math.round(overall),
      grade: this.getGrade(overall)
    };
  }

  getLCPScore(value) {
    if (value <= 2500) return 100;
    if (value <= 4000) return 75;
    return 50;
  }

  getFIDScore(value) {
    if (value <= 100) return 100;
    if (value <= 300) return 75;
    return 50;
  }

  getCLSScore(value) {
    if (value <= 0.1) return 100;
    if (value <= 0.25) return 75;
    return 50;
  }

  getFCPScore(value) {
    if (value <= 1800) return 100;
    if (value <= 3000) return 75;
    return 50;
  }

  getTTFBScore(value) {
    if (value <= 800) return 100;
    if (value <= 1800) return 75;
    return 50;
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Initialize performance monitor
let performanceMonitor;

export const initPerformanceMonitor = () => {
  if (typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
    
    // Report metrics when page unloads
    window.addEventListener('beforeunload', () => {
      const score = performanceMonitor.getPerformanceScore();
      console.log('Final Performance Score:', score);
    });
  }
};

export const getPerformanceMetrics = () => {
  return performanceMonitor ? performanceMonitor.metrics : {};
};

export const getPerformanceScore = () => {
  return performanceMonitor ? performanceMonitor.getPerformanceScore() : null;
};

export default PerformanceMonitor;
