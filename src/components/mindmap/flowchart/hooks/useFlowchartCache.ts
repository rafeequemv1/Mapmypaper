
import { useState } from 'react';

export const useFlowchartCache = () => {
  // Cache key prefix for flowcharts
  const cacheKeyPrefix = 'cachedFlowchart_';
  
  // Cache expiration time - 1 hour (in milliseconds)
  const cacheExpiration = 60 * 60 * 1000;
  
  const getCachedFlowchart = (pdfKey: string | null) => {
    const cacheKey = `${cacheKeyPrefix}${pdfKey || 'default'}`;
    
    try {
      const cachedItem = sessionStorage.getItem(cacheKey);
      
      if (!cachedItem) return null;
      
      const { data, timestamp } = JSON.parse(cachedItem);
      
      // Check if cache has expired
      if (Date.now() - timestamp > cacheExpiration) {
        // Cache expired, remove it
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
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Error caching flowchart:', error);
    }
  };

  return {
    getCachedFlowchart,
    setCachedFlowchart
  };
};
