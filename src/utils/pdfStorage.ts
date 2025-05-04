
// Simple utilities for storing and retrieving PDF data using IndexedDB

const DB_NAME = 'PdfStorageDB';
const STORE_NAME = 'pdfStore';
const DB_VERSION = 1;

// Variable to track current PDF key
let currentPdfKey: string | null = null;

// Initialize the database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Store PDF data in IndexedDB
export const storePdfData = async (key: string, data: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);

      request.onsuccess = () => {
        // Set as current PDF
        currentPdfKey = key;
        resolve();
      };

      request.onerror = () => {
        console.error('Error storing PDF data:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to store PDF data:', error);
    throw error;
  }
};

// Get PDF data from IndexedDB
export const getPdfData = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Error retrieving PDF data:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get PDF data:', error);
    throw error;
  }
};

// Set current PDF
export const setCurrentPdf = async (key: string): Promise<void> => {
  currentPdfKey = key;
  
  // Dispatch a custom event to notify components about PDF switching
  const event = new CustomEvent('pdfSwitched', {
    detail: { pdfKey: key }
  });
  
  window.dispatchEvent(event);
};

// Get current PDF key
export const getCurrentPdf = (): string | null => {
  return currentPdfKey;
};

// Delete PDF data
export const deletePdfData = async (key: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        if (currentPdfKey === key) {
          currentPdfKey = null;
        }
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting PDF data:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete PDF data:', error);
    throw error;
  }
};

// Get PDF text - uses sessionStorage as a cache for extracted text
export const getPdfText = async (pdfKey: string): Promise<string | null> => {
  try {
    // Check if we have the text cached in sessionStorage
    const cachedText = sessionStorage.getItem(`pdfText_${pdfKey}`);
    if (cachedText) {
      return cachedText;
    }
    
    // If not cached, get the PDF data and extract text
    // Note: In a real-world app, you would implement text extraction here
    // For now, we'll return a placeholder message since text extraction
    // would typically be done during upload/processing
    
    console.log(`Text for PDF ${pdfKey} not found in cache`);
    
    // Return null to indicate that the text needs to be extracted
    return null;
  } catch (error) {
    console.error('Failed to get PDF text:', error);
    return null;
  }
};

// Store PDF text in session storage for quick access
export const storePdfText = (pdfKey: string, text: string): void => {
  try {
    sessionStorage.setItem(`pdfText_${pdfKey}`, text);
    console.log(`Stored PDF text for ${pdfKey} in session storage`);
  } catch (error) {
    console.error('Failed to store PDF text in session storage:', error);
  }
};
