
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
    console.log(`Analytics event tracked: ${eventName}`, eventParams);
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
    console.log(`Page view tracked: ${page_path}`);
  } else {
    console.warn('Google Analytics not loaded or not available');
  }
};

// Track PDF upload
export const trackPdfUpload = (fileName?: string, fileSize?: number) => {
  trackEvent('pdf_upload', {
    file_name: fileName || 'unknown',
    file_size: fileSize || 0,
    timestamp: new Date().toISOString()
  });
};

// Track user sign-in
export const trackUserSignIn = (method: string) => {
  trackEvent('user_sign_in', {
    method,
    timestamp: new Date().toISOString()
  });
};

// Track mind map generation
export const trackMindMapGeneration = (pdfName?: string) => {
  trackEvent('mind_map_generation', {
    pdf_name: pdfName || 'unknown',
    timestamp: new Date().toISOString()
  });
};

// Track feature usage
export const trackFeatureUsage = (featureName: string) => {
  trackEvent('feature_usage', {
    feature: featureName,
    timestamp: new Date().toISOString()
  });
};

// Get statistics from simulated values (would use real GA API in production)
export const getUsageStatistics = async (): Promise<{
  papersAnalyzed: number;
  researchersCount: number;
}> => {
  // For production, you would implement a backend API to query Google Analytics Data API
  // You would need:
  // 1. A service account with access to GA4 property
  // 2. Server-side code to query the GA Data API
  // 3. Proper authentication using OAuth2 or service account key
  
  // For demo purposes, we're returning growing numbers based on time
  // This simulates increasing usage stats
  const baseDate = new Date('2023-01-01').getTime();
  const now = new Date().getTime();
  const daysSinceBase = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
  
  // Generate growing numbers based on time
  const papersAnalyzed = 120 + Math.floor(daysSinceBase * 0.8);
  const researchersCount = 50 + Math.floor(daysSinceBase * 0.3);
  
  console.log('Retrieved usage statistics:', { papersAnalyzed, researchersCount });
  
  return {
    papersAnalyzed,
    researchersCount
  };
};

// To implement real Google Analytics API integration, you would need:
/*
  To access real GA4 data, you would create a server-side function like:
  
  export const fetchRealAnalyticsData = async () => {
    // This would be implemented in a backend service like a Supabase Edge Function
    // It would use the Google Analytics Data API (v1beta)
    // https://developers.google.com/analytics/devguides/reporting/data/v1
    
    // The backend would use proper authentication and return sanitized results
    const response = await fetch('/api/analytics/stats');
    return response.json();
  };
*/
