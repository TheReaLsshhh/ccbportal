import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Prevent browser from restoring scroll position on reload/refresh and start at top
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
});

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 