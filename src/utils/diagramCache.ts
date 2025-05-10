
// Local storage cache keys
const CACHE_PREFIX = "mapmypaper_diagram_cache_";
const FLOWCHART_KEY = "flowchart_";
const MINDMAP_KEY = "mindmap_";

// Cache expiration time - 1 day in milliseconds
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CachedDiagram {
  code: string;
  timestamp: number;
}

/**
 * Store diagram code in local storage cache
 */
export const cacheDiagram = (
  pdfKey: string, 
  diagramType: 'flowchart' | 'mindmap', 
  code: string
): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${diagramType === 'flowchart' ? FLOWCHART_KEY : MINDMAP_KEY}${pdfKey}`;
    const cacheItem: CachedDiagram = {
      code,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    console.log(`Cached ${diagramType} for PDF: ${pdfKey}`);
  } catch (error) {
    console.error(`Failed to cache ${diagramType}:`, error);
  }
};

/**
 * Retrieve diagram code from cache if available and not expired
 */
export const getCachedDiagram = (
  pdfKey: string, 
  diagramType: 'flowchart' | 'mindmap'
): string | null => {
  if (!pdfKey) return null;
  
  try {
    const cacheKey = `${CACHE_PREFIX}${diagramType === 'flowchart' ? FLOWCHART_KEY : MINDMAP_KEY}${pdfKey}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const parsedItem: CachedDiagram = JSON.parse(cachedItem);
    
    // Check if the cache has expired
    if (Date.now() - parsedItem.timestamp > CACHE_EXPIRY) {
      // Cache expired, remove it
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsedItem.code;
  } catch (error) {
    console.error(`Failed to retrieve cached ${diagramType}:`, error);
    return null;
  }
};

/**
 * Clear all cached diagrams for a specific PDF
 */
export const clearCachedDiagrams = (pdfKey: string): void => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${FLOWCHART_KEY}${pdfKey}`);
    localStorage.removeItem(`${CACHE_PREFIX}${MINDMAP_KEY}${pdfKey}`);
    console.log(`Cleared cached diagrams for PDF: ${pdfKey}`);
  } catch (error) {
    console.error('Failed to clear cached diagrams:', error);
  }
};

/**
 * Clear all diagram caches
 */
export const clearAllCachedDiagrams = (): void => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    console.log('Cleared all cached diagrams');
  } catch (error) {
    console.error('Failed to clear all cached diagrams:', error);
  }
};
