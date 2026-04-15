import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="app-page-loader" role="status" aria-live="polite">
      <div className="app-page-loader__inner">
        <div className="app-page-loader__spinner" aria-hidden="true" />
        <p className="app-page-loader__message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
