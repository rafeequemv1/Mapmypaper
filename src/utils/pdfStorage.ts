
// PDF Storage Utility for IndexedDB
// Manages PDF data storage, retrieval, and state management

// Database configuration
const DB_NAME = 'PdfStorageDB';
const DB_VERSION = 1;
const PDF_STORE = 'pdfStore';
const CURRENT_PDF_KEY = 'currentPdfKey';

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

// Store PDF data in IndexedDB
export const storePdfData = async (key: string, pdfData: string): Promise<void> => {
  try {
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

// Retrieve PDF data from IndexedDB by key
export const getPdfData = async (key: string): Promise<string | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const pdfData = request.result;
        resolve(pdfData || null);
      };
      
      request.onerror = () => {
        console.error("Error retrieving PDF data:", request.error);
        reject(new Error(`Failed to get PDF data: ${request.error?.message || 'Unknown error'}`));
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in getPdfData:", error);
    throw error;
  }
};

// Set current active PDF key
export const setCurrentPdf = async (key: string): Promise<void> => {
  try {
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

// Get current active PDF key
export const getCurrentPdfKey = async (): Promise<string | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PDF_STORE], 'readonly');
      const store = transaction.objectStore(PDF_STORE);
      
      const keyRequest = store.get(CURRENT_PDF_KEY);
      
      keyRequest.onsuccess = () => {
        const currentKey = keyRequest.result;
        resolve(currentKey || null);
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
    console.error("Error in getCurrentPdfKey:", error);
    throw error;
  }
};

// Get current active PDF data
export const getCurrentPdfData = async (): Promise<string | null> => {
  try {
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
        
        // Then get the PDF data using that key
        const dataRequest = store.get(currentKey);
        
        dataRequest.onsuccess = () => {
          const pdfData = dataRequest.result;
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

// Clear/remove PDF data for a specific key
export const clearPdfData = async (key: string): Promise<void> => {
  try {
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

// Get specific PDF text from sessionStorage
export const getPdfText = (pdfKey: string): string | null => {
  try {
    return sessionStorage.getItem(`pdfText_${pdfKey}`);
  } catch (error) {
    console.error("Error getting PDF text:", error);
    return null;
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
