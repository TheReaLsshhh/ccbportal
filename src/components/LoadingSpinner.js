import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  useEffect(() => {
    const root = document.getElementById('root');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (root) {
      root.setAttribute('inert', '');
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      if (root) {
        root.removeAttribute('inert');
      }
    };
  }, []);

  const node = (
    <div
      className="app-page-loader"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="app-page-loader-msg"
    >
      <div className="app-page-loader__inner">
        <div className="loader" aria-hidden="true" />
        <p id="app-page-loader-msg" className="app-page-loader__message">
          {message}
        </p>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(node, document.body);
  }

  return node;
};

export default LoadingSpinner;
