
// PDF Storage Utility for IndexedDB with Caching
// Manages PDF data storage, retrieval, and state management

// Database configuration
const DB_NAME = 'PdfStorageDB';
const DB_VERSION = 1;
const PDF_STORE = 'pdfStore';
const CURRENT_PDF_KEY = 'currentPdfKey';

// Local cache to avoid redundant fetches from IndexedDB
const pdfDataCache = new Map<string, string>();

// Helper function to open the database connection
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Create object store when database is being upgraded
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create the PDF store if it doesn't exist
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE);
        console.log(`Created ${PDF_STORE} object store`);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      
      // Verify the store exists
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        // Close the connection before trying to delete
        db.close();
        
        // If the store doesn't exist but the database does, delete and recreate
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          console.log(`${DB_NAME} deleted, will recreate with correct schema`);
          // Try opening again with the correct version
          openDatabase().then(resolve).catch(reject);
        };
        deleteRequest.onerror = (error) => {
          console.error("Error deleting database:", error);
          reject(new Error("Failed to recreate database with correct schema"));
        };
        return;
      }
      
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("Database error:", request.error);
      reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
    };
  });
};

// Preload all PDF keys into cache on startup with improved reliability
export const preloadPdfCache = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        const keys = request.result as string[];
        console.log(`Found ${keys.length} PDF keys to preload`);
        
        // Filter out special keys like CURRENT_PDF_KEY
        const pdfKeys = keys.filter(k => k !== CURRENT_PDF_KEY);
        
        // Mark as available but don't load the full data yet
        pdfKeys.forEach(key => {
          if (!key.startsWith('mindMapReady_')) {
            pdfDataCache.set(key, 'pending');
          }
        });
        
        // Also try to preload the current PDF
        const currentKeyRequest = store.get(CURRENT_PDF_KEY);
        currentKeyRequest.onsuccess = () => {
          const currentKey = currentKeyRequest.result;
          if (currentKey && typeof currentKey === 'string') {
            // Store the current key in cache
            pdfDataCache.set(CURRENT_PDF_KEY, currentKey);
          }
          resolve();
        };
        
        currentKeyRequest.onerror = () => {
          console.warn("Could not preload current PDF key");
          resolve();
        };
      };
      
      request.onerror = () => {
        console.error("Error preloading PDF keys:", request.error);
        reject(new Error(`Failed to preload PDF keys: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in preloadPdfCache:", error);
  }
};

// Call preload on module init
preloadPdfCache();

// Store PDF data in IndexedDB and cache with improved error handling
export const storePdfData = async (key: string, pdfData: string): Promise<void> => {
  try {
    // Store in cache immediately for instant access
    pdfDataCache.set(key, pdfData);
    
    // Reset any global PDF load errors
    if (window) {
      window.__PDF_LOAD_ERROR__ = null;
    }
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readwrite');
      const store = transaction.objectStore(PDF_STORE);
      
      const request = store.put(pdfData, key);
      
      request.onsuccess = () => {
        console.log(`PDF data stored for key: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error("Error storing PDF data:", request.error);
        reject(new Error(`Failed to store PDF data: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in storePdfData:", error);
    throw error;
  }
};

// Retrieve PDF data from cache first, then IndexedDB if not cached
export const getPdfData = async (key: string): Promise<string | null> => {
  try {
    // Reset any previous load errors
    if (window) {
      window.__PDF_LOAD_ERROR__ = null;
    }
    
    // Check cache first for instant retrieval
    if (pdfDataCache.has(key)) {
      const cachedData = pdfDataCache.get(key);
      
      // If it's marked as pending, load from IndexedDB
      if (cachedData !== 'pending') {
        console.log(`PDF data retrieved from cache for key: ${key}`);
        return cachedData || null;
      }
    }
    
    // Not in cache or marked as pending, get from IndexedDB
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const pdfData = request.result;
        
        // Store in cache for future fast access
        if (pdfData) {
          pdfDataCache.set(key, pdfData);
          console.log(`PDF data retrieved from IndexedDB for key: ${key}`);
          resolve(pdfData || null);
        } else {
          // Set error if PDF not found
          if (window) {
            window.__PDF_LOAD_ERROR__ = `PDF data not found for key: ${key}`;
          }
          console.error(`PDF data not found for key: ${key}`);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        const errorMsg = `Failed to get PDF data: ${request.error?.message || 'Unknown error'}`;
        console.error("Error retrieving PDF data:", request.error);
        
        // Set global error for UI to display
        if (window) {
          window.__PDF_LOAD_ERROR__ = errorMsg;
        }
        
        reject(new Error(errorMsg));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in getPdfData:", error);
    
    // Set global error for UI to display
    if (window) {
      window.__PDF_LOAD_ERROR__ = `Error loading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    throw error;
  }
};

// Set current active PDF key with caching
export const setCurrentPdf = async (key: string): Promise<void> => {
  try {
    // Update current key in memory
    pdfDataCache.set(CURRENT_PDF_KEY, key);
    
    // Start preloading the actual PDF data if it's not already cached
    if (pdfDataCache.has(key) && pdfDataCache.get(key) === 'pending') {
      // Don't await to avoid blocking the UI
      getPdfData(key).catch(err => console.error("Background preload error:", err));
    }
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readwrite');
      const store = transaction.objectStore(PDF_STORE);
      
      const request = store.put(key, CURRENT_PDF_KEY);
      
      request.onsuccess = () => {
        console.log(`Current PDF set to: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error("Error setting current PDF:", request.error);
        reject(new Error(`Failed to set current PDF: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in setCurrentPdf:", error);
    throw error;
  }
};

// Get current active PDF data with caching
export const getCurrentPdfData = async (): Promise<string | null> => {
  try {
    // Check if current key is in cache
    const cachedCurrentKey = pdfDataCache.get(CURRENT_PDF_KEY);
    
    if (cachedCurrentKey) {
      // If we have the current key cached, get PDF data for that key
      return getPdfData(cachedCurrentKey);
    }
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      
      // First get the current PDF key
      const keyRequest = store.get(CURRENT_PDF_KEY);
      
      keyRequest.onsuccess = () => {
        const currentKey = keyRequest.result;
        
        if (!currentKey) {
          console.log("No current PDF key found");
          resolve(null);
          return;
        }
        
        // Cache the current key
        pdfDataCache.set(CURRENT_PDF_KEY, currentKey);
        
        // Then get the PDF data using that key
        const dataRequest = store.get(currentKey);
        
        dataRequest.onsuccess = () => {
          const pdfData = dataRequest.result;
          
          // Cache the PDF data
          if (pdfData) {
            pdfDataCache.set(currentKey, pdfData);
          }
          
          resolve(pdfData || null);
        };
        
        dataRequest.onerror = () => {
          console.error("Error retrieving current PDF data:", dataRequest.error);
          reject(new Error(`Failed to get current PDF data: ${dataRequest.error?.message || 'Unknown error'}`));
        };
      };
      
      keyRequest.onerror = () => {
        console.error("Error retrieving current PDF key:", keyRequest.error);
        reject(new Error(`Failed to get current PDF key: ${keyRequest.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in getCurrentPdfData:", error);
    throw error;
  }
};

// Clear/remove PDF data for a specific key from both cache and IndexedDB
export const clearPdfData = async (key: string): Promise<void> => {
  try {
    // Remove from cache immediately
    pdfDataCache.delete(key);
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readwrite');
      const store = transaction.objectStore(PDF_STORE);
      
      const request = store.delete(key);
      
      request.onsuccess = () => {
        console.log(`PDF data cleared for key: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error("Error clearing PDF data:", request.error);
        reject(new Error(`Failed to clear PDF data: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in clearPdfData:", error);
    throw error;
  }
};

// Check if a mindmap is ready for a specific PDF
export const isMindMapReady = (pdfKey: string): boolean => {
  try {
    // Check if we have a mindmap entry for this PDF key in session storage
    return sessionStorage.getItem(`mindMapReady_${pdfKey}`) === 'true';
  } catch (error) {
    console.error("Error checking if mindmap is ready:", error);
    return false;
  }
};

// Get all PDF texts for multi-PDF context in chat
export const getAllPdfText = (): string[] => {
  try {
    const pdfs = [];
    
    // Get all PDF keys from session storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('pdfText_')) {
        const pdfText = sessionStorage.getItem(key);
        if (pdfText) {
          pdfs.push(pdfText);
        }
      }
    }
    
    return pdfs;
  } catch (error) {
    console.error("Error getting all PDF texts:", error);
    return [];
  }
};
