
import { useState } from 'react';

export const useFlowchartCache = () => {
  // Cache key prefix for flowcharts
  const cacheKeyPrefix = 'cachedFlowchart_';
  
  // Cache expiration time - extended to 24 hours (in milliseconds)
  const cacheExpiration = 24 * 60 * 60 * 1000;
  
  const getCachedFlowchart = (pdfKey: string | null) => {
    const cacheKey = `${cacheKeyPrefix}${pdfKey || 'default'}`;
    
    try {
      // Try localStorage first (more persistent)
      let cachedItem = localStorage.getItem(cacheKey);
      
      // Fallback to sessionStorage if not in localStorage
      if (!cachedItem) {
        cachedItem = sessionStorage.getItem(cacheKey);
      }
      
      if (!cachedItem) return null;
      
      const { data, timestamp } = JSON.parse(cachedItem);
      
      // Check if cache has expired
      if (Date.now() - timestamp > cacheExpiration) {
        // Cache expired, remove it from both storage types
        localStorage.removeItem(cacheKey);
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      // If there's any parsing error, return null
      console.warn('Error retrieving cached flowchart:', error);
      return null;
    }
  };

  const setCachedFlowchart = (pdfKey: string | null, flowchart: string) => {
    const cacheKey = `${cacheKeyPrefix}${pdfKey || 'default'}`;
    
    try {
      const cacheItem = {
        data: flowchart,
        timestamp: Date.now()
      };
      
      const cacheString = JSON.stringify(cacheItem);
      
      // Store in both localStorage (persistent) and sessionStorage (fallback)
      try {
        localStorage.setItem(cacheKey, cacheString);
      } catch (e) {
        console.warn('Could not store in localStorage, falling back to sessionStorage');
      }
      
      // Always try sessionStorage as fallback
      try {
        sessionStorage.setItem(cacheKey, cacheString);
      } catch (e) {
        console.warn('Error caching flowchart in sessionStorage:', e);
      }
    } catch (error) {
      console.warn('Error preparing flowchart cache:', error);
    }
  };

  return {
    getCachedFlowchart,
    setCachedFlowchart
  };
};
