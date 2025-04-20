
/**
 * Utility for storing and retrieving PDF data using IndexedDB
 * This solves the issue with sessionStorage quota limitations
 */

// Define the DB name and version
const DB_NAME = 'pdfStorage';
const DB_VERSION = 1;
const PDF_STORE = 'pdfData';

// Open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject("Error opening IndexedDB");
    };
    
    request.onsuccess = (event) => {
      const db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Store PDF data in IndexedDB
export const storePdfData = async (pdfData: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    
    // Always store with the same key to override any previous PDF
    await store.put({ id: 'currentPdf', data: pdfData });
    
    // Store a flag in sessionStorage to indicate PDF is available
    sessionStorage.setItem('hasPdfData', 'true');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        db.close();
        reject(new Error('Failed to save PDF data to IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error storing PDF data in IndexedDB:', error);
    throw error;
  }
};

// Retrieve PDF data from IndexedDB
export const getPdfData = async (): Promise<string | null> => {
  try {
    // Check if we have a PDF stored
    if (sessionStorage.getItem('hasPdfData') !== 'true') {
      return null;
    }
    
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readonly');
    const store = transaction.objectStore(PDF_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get('currentPdf');
      
      request.onsuccess = () => {
        db.close();
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        db.close();
        reject(new Error('Failed to retrieve PDF data from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error retrieving PDF data from IndexedDB:', error);
    return null;
  }
};

// Clear PDF data from IndexedDB
export const clearPdfData = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    
    await store.delete('currentPdf');
    sessionStorage.removeItem('hasPdfData');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        db.close();
        reject(new Error('Failed to clear PDF data from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error clearing PDF data from IndexedDB:', error);
    throw error;
  }
};
