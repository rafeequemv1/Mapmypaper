
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

// Track PDF upload
export const trackPdfUpload = (fileName?: string, fileSize?: number) => {
  trackEvent('pdf_upload', {
    file_name: fileName || 'unknown',
    file_size: fileSize || 0,
    timestamp: new Date().toISOString()
  });
};

// Get statistics (this would typically come from a backend API)
// For now, we'll use placeholder values that could be updated later
// with real data from Google Analytics API or your database
export const getUsageStatistics = async (): Promise<{
  papersAnalyzed: number;
  researchersCount: number;
}> => {
  // In a real implementation, this would fetch data from your backend
  // which would query Google Analytics API or your database
  
  // For demo purposes, we're returning growing numbers based on time
  // This simulates increasing usage stats
  const baseDate = new Date('2023-01-01').getTime();
  const now = new Date().getTime();
  const daysSinceBase = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
  
  // Generate growing numbers based on time
  const papersAnalyzed = 120 + Math.floor(daysSinceBase * 0.8);
  const researchersCount = 50 + Math.floor(daysSinceBase * 0.3);
  
  return {
    papersAnalyzed,
    researchersCount
  };
};
