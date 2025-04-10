/**
 * PDF Storage utility - Uses IndexedDB for storing large PDF files
 * more reliably than sessionStorage
 */

// Database configuration
const DB_NAME = 'pdfStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdfFiles';
const PDF_KEY = 'currentPdf';
const IMAGES_KEY = 'pdfImages';

// Initialize the database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Could not open PDF storage database');
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log('PDF storage database created');
      }
    };
  });
};

/**
 * Store PDF data in IndexedDB
 * @param pdfData Base64 string representation of the PDF
 * @returns Promise that resolves when storage is complete
 */
export const storePDF = async (pdfData: string): Promise<void> => {
  try {
    console.log('Storing PDF in IndexedDB, data length:', pdfData.length);
    
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store as a single object with id as key
    const storeRequest = store.put({
      id: PDF_KEY,
      data: pdfData,
      timestamp: Date.now()
    });
    
    return new Promise((resolve, reject) => {
      storeRequest.onsuccess = () => {
        console.log('PDF successfully stored in IndexedDB');
        
        // For backwards compatibility, also try to store a reference in sessionStorage
        try {
          // Store a marker in sessionStorage to indicate IndexedDB is used
          sessionStorage.setItem('pdfStorageMethod', 'indexedDB');
          sessionStorage.setItem('pdfAvailable', 'true');
        } catch (e) {
          // Ignore session storage errors - IndexedDB is our primary storage
          console.log('Could not update sessionStorage, but IndexedDB storage succeeded');
        }
        
        resolve();
      };
      
      storeRequest.onerror = (event) => {
        console.error('Error storing PDF:', event);
        reject('Failed to store PDF: Database error');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in storePDF:', error);
    throw new Error(`Failed to store PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Retrieve PDF data from IndexedDB
 * @returns Promise that resolves with the PDF data
 */
export const retrievePDF = async (): Promise<string | null> => {
  // First try session storage for a quick check if PDF exists
  try {
    const pdfAvailable = sessionStorage.getItem('pdfAvailable');
    if (pdfAvailable !== 'true') {
      console.log('Quick check - no PDF marker in sessionStorage');
    }
  } catch (e) {
    // Ignore session storage errors
  }
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(PDF_KEY);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          console.log('PDF retrieved from IndexedDB, length:', result.data.length);
          
          // Update session storage marker
          try {
            sessionStorage.setItem('pdfAvailable', 'true');
          } catch (e) {
            // Ignore session storage errors
          }
          
          resolve(result.data);
        } else {
          console.log('No PDF found in IndexedDB, checking sessionStorage');
          
          // Fallback to session storage for compatibility with older data
          try {
            const pdfFromSession = sessionStorage.getItem('pdfData') || 
                                   sessionStorage.getItem('uploadedPdfData');
            if (pdfFromSession) {
              console.log('PDF found in sessionStorage, migrating to IndexedDB');
              // Migrate to IndexedDB for future use
              storePDF(pdfFromSession)
                .catch(err => console.error('Migration to IndexedDB failed:', err));
              
              return resolve(pdfFromSession);
            }
            resolve(null);
          } catch (e) {
            console.error('Error reading from sessionStorage:', e);
            resolve(null);
          }
        }
      };
      
      getRequest.onerror = (event) => {
        console.error('Error retrieving PDF:', event);
        reject('Failed to retrieve PDF: Database error');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in retrievePDF:', error);
    
    // Fallback to session storage if IndexedDB fails
    try {
      const pdfFromSession = sessionStorage.getItem('pdfData') || 
                             sessionStorage.getItem('uploadedPdfData');
      return pdfFromSession;
    } catch (e) {
      console.error('Fallback to sessionStorage failed:', e);
      return null;
    }
  }
};

/**
 * Clear all PDF data
 */
export const clearPDF = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(PDF_KEY);
    
    // Also clear session storage markers
    try {
      sessionStorage.removeItem('pdfData');
      sessionStorage.removeItem('uploadedPdfData');
      sessionStorage.removeItem('pdfStorageMethod');
      sessionStorage.removeItem('pdfAvailable');
    } catch (e) {
      console.log('Error clearing sessionStorage:', e);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        console.log('PDF data cleared from storage');
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Error clearing PDF data:', event);
        reject('Failed to clear PDF data');
      };
    });
  } catch (error) {
    console.error('Error in clearPDF:', error);
  }
};

/**
 * Check if a PDF is available in storage (quick check)
 * @returns Promise that resolves with a boolean indicating availability
 */
export const isPdfAvailable = async (): Promise<boolean> => {
  // Try session storage first for a quick check
  try {
    const markerExists = sessionStorage.getItem('pdfAvailable') === 'true';
    if (markerExists) {
      return true;
    }
  } catch (e) {
    // Ignore session storage errors
  }
  
  // If not in session storage, check IndexedDB
  try {
    const pdfData = await retrievePDF();
    return !!pdfData;
  } catch (error) {
    console.error('Error checking PDF availability:', error);
    return false;
  }
};

/**
 * Store PDF images in IndexedDB
 * @param images Array of image data URLs
 * @returns Promise that resolves when storage is complete
 */
export const storePdfImages = async (images: string[]): Promise<void> => {
  try {
    console.log('Storing PDF images in IndexedDB, count:', images.length);
    
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store as a single object with id as key
    const storeRequest = store.put({
      id: IMAGES_KEY,
      data: images,
      timestamp: Date.now()
    });
    
    return new Promise((resolve, reject) => {
      storeRequest.onsuccess = () => {
        console.log('PDF images successfully stored in IndexedDB');
        resolve();
      };
      
      storeRequest.onerror = (event) => {
        console.error('Error storing PDF images:', event);
        reject('Failed to store PDF images: Database error');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in storePdfImages:', error);
    throw new Error(`Failed to store PDF images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Retrieve PDF images from IndexedDB
 * @returns Promise that resolves with array of image data URLs
 */
export const retrievePdfImages = async (): Promise<string[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(IMAGES_KEY);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          console.log('PDF images retrieved from IndexedDB, count:', result.data.length);
          resolve(result.data);
        } else {
          console.log('No PDF images found in IndexedDB');
          resolve([]);
        }
      };
      
      getRequest.onerror = (event) => {
        console.error('Error retrieving PDF images:', event);
        reject('Failed to retrieve PDF images: Database error');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in retrievePdfImages:', error);
    return [];
  }
};

// Check if the current browser supports IndexedDB
export const isIndexedDBSupported = (): boolean => {
  return 'indexedDB' in window;
};
