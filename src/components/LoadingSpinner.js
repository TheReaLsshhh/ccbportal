import React from 'react';
import { createPortal } from 'react-dom';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const node = (
    <div className="app-page-loader" role="status" aria-live="polite">
      <div className="app-page-loader__inner">
        <div className="app-page-loader__spinner" aria-hidden="true" />
        <p className="app-page-loader__message">{message}</p>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(node, document.body);
  }

  return node;
};

export default LoadingSpinner;
