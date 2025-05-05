
/**
 * Utility for storing and retrieving PDF data using IndexedDB
 * This solves the issue with sessionStorage quota limitations
 */

// Import necessary types from PdfTabs
import { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";

// Define the DB name and version
const DB_NAME = 'pdfStorage';
const DB_VERSION = 1;
const PDF_STORE = 'pdfData';

// Open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error("Error opening IndexedDB"));
    };
    
    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Store PDF data in IndexedDB with a specific key
export const storePdfData = async (pdfKey: string, pdfData: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    
    // Store with the specific PDF key
    await store.put({ id: pdfKey, data: pdfData });
    
    // Store a flag in sessionStorage to track available PDFs (but not the data itself)
    sessionStorage.setItem(`hasPdfData_${pdfKey}`, 'true');
    sessionStorage.setItem(`mindMapReady_${pdfKey}`, 'true');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        // Dispatch a custom event that PDF data has been updated
        window.dispatchEvent(new CustomEvent('pdfDataUpdated', { detail: { pdfKey } }));
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

// Check if a mindmap has been generated for this PDF
export const isMindMapReady = (pdfKey: string): boolean => {
  return sessionStorage.getItem(`mindMapReady_${pdfKey}`) === 'true';
};

// Retrieve specific PDF data from IndexedDB
export const getPdfData = async (pdfKey: string): Promise<string | null> => {
  try {
    // Check if we have this PDF stored
    if (sessionStorage.getItem(`hasPdfData_${pdfKey}`) !== 'true') {
      console.log(`No storage marker found for PDF: ${pdfKey}`);
      return null;
    }
    
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readonly');
    const store = transaction.objectStore(PDF_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(pdfKey);
      
      request.onsuccess = () => {
        db.close();
        if (request.result) {
          resolve(request.result.data);
        } else {
          // Data not found in IndexedDB even though marker exists
          console.warn(`PDF data marker exists but data not found in IndexedDB for: ${pdfKey}`);
          // Remove the invalid marker
          sessionStorage.removeItem(`hasPdfData_${pdfKey}`);
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

// For backward compatibility - gets the currently active PDF
export const getCurrentPdfData = async (): Promise<string | null> => {
  try {
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
        reject(new Error('Failed to retrieve current PDF data from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error retrieving current PDF data from IndexedDB:', error);
    return null;
  }
};

// Set current active PDF (for viewer)
export const setCurrentPdf = async (pdfKey: string): Promise<void> => {
  try {
    // First get the PDF data by key
    const pdfData = await getPdfData(pdfKey);
    if (!pdfData) {
      throw new Error('PDF data not found for key: ' + pdfKey);
    }
    
    // Then store it as current PDF
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    
    await store.put({ id: 'currentPdf', data: pdfData });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        db.close();
        reject(new Error('Failed to set current PDF'));
      };
    });
  } catch (error) {
    console.error('Error setting current PDF:', error);
    throw error;
  }
};

// Clear PDF data from IndexedDB
export const clearPdfData = async (pdfKey: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([PDF_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    
    await store.delete(pdfKey);
    sessionStorage.removeItem(`hasPdfData_${pdfKey}`);
    sessionStorage.removeItem(`mindMapReady_${pdfKey}`);
    
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

// Get text content from all PDFs
export const getAllPdfText = async (): Promise<string> => {
  try {
    const pdfs = getAllPdfs();
    let allText = "";
    
    // Get text content from each PDF using IndexedDB
    for (const pdf of pdfs) {
      const key = getPdfKey(pdf);
      try {
        // First check if this PDF has text content in sessionStorage
        // This is for backward compatibility or if text was extracted separately
        let pdfText = sessionStorage.getItem(`pdfText_${key}`);
        
        // If not in sessionStorage, try to get the PDF data from IndexedDB and extract text
        if (!pdfText) {
          const pdfData = await getPdfData(key);
          if (pdfData) {
            // If we have PDF data but no extracted text, we'll use the PDF data
            // In a real app, you'd extract text here, but for now just indicate we have the PDF
            pdfText = `[PDF content available but text extraction not implemented for: ${pdf.name}]`;
          }
        }
        
        if (pdfText) {
          allText += `\n\n=== PDF: ${pdf.name} ===\n\n`;
          allText += pdfText;
        }
      } catch (error) {
        console.error(`Error retrieving text for PDF ${pdf.name}:`, error);
      }
    }
    
    return allText || "";
  } catch (error) {
    console.error("Error retrieving all PDF text:", error);
    return "";
  }
};
