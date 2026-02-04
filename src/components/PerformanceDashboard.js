import React, { useState, useEffect } from 'react';
import { getPerformanceMetrics, getPerformanceScore } from '../utils/PerformanceMonitor';
import './PerformanceDashboard.css';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [score, setScore] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getPerformanceMetrics());
      setScore(getPerformanceScore());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!isVisible || process.env.NODE_ENV === 'production') {
    return null;
  }

  const getMetricColor = (value, type) => {
    if (type === 'LCP') {
      if (value <= 2500) return '#4CAF50';
      if (value <= 4000) return '#FF9800';
      return '#F44336';
    }
    if (type === 'FID') {
      if (value <= 100) return '#4CAF50';
      if (value <= 300) return '#FF9800';
      return '#F44336';
    }
    if (type === 'CLS') {
      if (value <= 0.1) return '#4CAF50';
      if (value <= 0.25) return '#FF9800';
      return '#F44336';
    }
    return '#2196F3';
  };

  const formatValue = (value, type) => {
    if (type === 'CLS') return value.toFixed(3);
    if (type === 'LCP' || type === 'FID' || type === 'FCP' || type === 'TTFB') {
      return `${Math.round(value)}ms`;
    }
    return value;
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h3>Performance Dashboard</h3>
        <button 
          className="close-btn" 
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
      
      {score && (
        <div className="overall-score">
          <div className={`score-circle grade-${score.grade.toLowerCase()}`}>
            <span className="score-value">{score.overall}</span>
            <span className="score-grade">{score.grade}</span>
          </div>
          <div className="score-details">
            <div className="score-item">
              <span>LCP:</span>
              <span style={{ color: getMetricColor(score.individual.LCP, 'LCP') }}>
                {score.individual.LCP}/100
              </span>
            </div>
            <div className="score-item">
              <span>FID:</span>
              <span style={{ color: getMetricColor(score.individual.FID, 'FID') }}>
                {score.individual.FID}/100
              </span>
            </div>
            <div className="score-item">
              <span>CLS:</span>
              <span style={{ color: getMetricColor(score.individual.CLS, 'CLS') }}>
                {score.individual.CLS}/100
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Largest Contentful Paint</h4>
          <div 
            className="metric-value"
            style={{ color: getMetricColor(metrics.LCP?.value, 'LCP') }}
          >
            {metrics.LCP ? formatValue(metrics.LCP.value, 'LCP') : 'N/A'}
          </div>
          <div className="metric-info">
            {metrics.LCP?.element && <span>Element: {metrics.LCP.element}</span>}
          </div>
        </div>

        <div className="metric-card">
          <h4>First Input Delay</h4>
          <div 
            className="metric-value"
            style={{ color: getMetricColor(metrics.FID?.value, 'FID') }}
          >
            {metrics.FID ? formatValue(metrics.FID.value, 'FID') : 'N/A'}
          </div>
          <div className="metric-info">
            {metrics.FID?.inputType && <span>Input: {metrics.FID.inputType}</span>}
          </div>
        </div>

        <div className="metric-card">
          <h4>Cumulative Layout Shift</h4>
          <div 
            className="metric-value"
            style={{ color: getMetricColor(metrics.CLS?.value, 'CLS') }}
          >
            {metrics.CLS ? formatValue(metrics.CLS.value, 'CLS') : 'N/A'}
          </div>
        </div>

        <div className="metric-card">
          <h4>First Contentful Paint</h4>
          <div 
            className="metric-value"
            style={{ color: getMetricColor(metrics.FCP?.value, 'FCP') }}
          >
            {metrics.FCP ? formatValue(metrics.FCP.value, 'FCP') : 'N/A'}
          </div>
        </div>

        <div className="metric-card">
          <h4>Time to First Byte</h4>
          <div 
            className="metric-value"
            style={{ color: getMetricColor(metrics.TTFB?.value, 'TTFB') }}
          >
            {metrics.TTFB ? formatValue(metrics.TTFB.value, 'TTFB') : 'N/A'}
          </div>
        </div>

        <div className="metric-card">
          <h4>Long Tasks</h4>
          <div className="metric-value">
            {metrics.longTasks ? metrics.longTasks.length : '0'}
          </div>
          <div className="metric-info">
            {metrics.longTasks && metrics.longTasks.length > 0 && (
              <span>
                Avg: {Math.round(
                  metrics.longTasks.reduce((sum, task) => sum + task.duration, 0) / 
                  metrics.longTasks.length
                )}ms
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="resources-section">
        <h4>Resource Loading</h4>
        {metrics.resources && (
          <div className="resources-grid">
            {['script', 'stylesheet', 'image', 'font'].map(type => {
              const resources = metrics.resources.filter(r => r.type === type);
              const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
              const avgDuration = resources.length > 0 
                ? resources.reduce((sum, r) => sum + r.duration, 0) / resources.length 
                : 0;

              return (
                <div key={type} className="resource-card">
                  <h5>{type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                  <div className="resource-stats">
                    <span>Count: {resources.length}</span>
                    <span>Size: {(totalSize / 1024).toFixed(1)}KB</span>
                    <span>Avg: {Math.round(avgDuration)}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <small>Press Ctrl+Shift+P to toggle • Updates every 5 seconds</small>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
