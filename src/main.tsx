
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { trackPageView, trackEvent } from './utils/analytics';

// Initialize tracker
if (typeof window !== 'undefined') {
  // Console info about analytics
  console.info('Analytics initialized. Page views and events will be tracked.');
  
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
    trackEvent('app_loaded', { timestamp: new Date().toISOString() });
  });
}

// Use the correct non-null assertion and ensure we find the element
const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <App />
);
