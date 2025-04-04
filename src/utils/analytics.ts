
/**
 * Utility functions for Google Analytics tracking
 */

// Track a custom event
export const trackEvent = (
  eventName: string, 
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.warn('Google Analytics not loaded or not available');
  }
};

// Track page views (can be used with React Router)
export const trackPageView = (page_path: string, page_title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-NWGXMB50F6', {
      page_path,
      page_title
    });
  } else {
    console.warn('Google Analytics not loaded or not available');
  }
};
