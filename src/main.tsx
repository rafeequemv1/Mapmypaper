
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { trackPageView } from './utils/analytics';

// Initialize tracker
if (typeof window !== 'undefined') {
  // Listen for route changes to track page views
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    trackPageView(window.location.pathname);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    trackPageView(window.location.pathname);
  };
  
  // Track initial page load
  window.addEventListener('load', () => {
    trackPageView(window.location.pathname);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
