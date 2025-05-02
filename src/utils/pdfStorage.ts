
import { openDB } from 'idb';

interface PdfMeta {
  name: string;
  size: number;
  lastModified: number;
}

const DB_NAME = 'pdfDB';
const DB_VERSION = 1;

const openDatabase = async () => {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pdfData')) {
          db.createObjectStore('pdfData');
        }
        if (!db.objectStoreNames.contains('pdfText')) {
          db.createObjectStore('pdfText');
        }
      },
    });
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    throw error;
  }
};

export const storePdfData = async (pdfKey: string, data: string) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pdfData', 'readwrite');
    const store = tx.objectStore('pdfData');
    await store.put(data, pdfKey);
    await tx.done;
    console.log('PDF data stored successfully!', pdfKey);
  } catch (error) {
    console.error('Error storing PDF data:', error);
    throw error;
  }
};

export const storePdfText = async (pdfKey: string, text: string) => {
  try {
    // Store in sessionStorage for immediate use
    sessionStorage.setItem(`pdfText_${pdfKey}`, text);
    
    // Also store in IndexedDB for persistence
    const db = await openDatabase();
    const tx = db.transaction('pdfText', 'readwrite');
    const store = tx.objectStore('pdfText');
    await store.put(text, pdfKey);
    await tx.done;
    console.log('PDF text stored successfully!', pdfKey);
    return true;
  } catch (error) {
    console.error('Error storing PDF text:', error);
    return false;
  }
};

export const getPdfData = async (pdfKey: string): Promise<string | undefined> => {
  if (!pdfKey) {
    console.warn('No PDF key provided to getPdfData');
    return undefined;
  }
  
  try {
    console.log('Getting PDF data for key:', pdfKey);
    const db = await openDatabase();
    const tx = db.transaction('pdfData', 'readonly');
    const store = tx.objectStore('pdfData');
    const pdfData = await store.get(pdfKey);
    await tx.done;
    
    if (!pdfData) {
      console.warn('No PDF data found for key:', pdfKey);
    } else {
      console.log('PDF data retrieved successfully for key:', pdfKey);
    }
    
    return pdfData;
  } catch (error) {
    console.error('Error retrieving PDF data:', error, pdfKey);
    throw error;
  }
};

export const deletePdfData = async (pdfKey: string) => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pdfData', 'readwrite');
    const store = tx.objectStore('pdfData');
    await store.delete(pdfKey);
    await tx.done;
    
    // Also delete from pdfText store
    const textTx = db.transaction('pdfText', 'readwrite');
    const textStore = textTx.objectStore('pdfText');
    await textStore.delete(pdfKey);
    await textTx.done;
    
    // Clear from session storage
    sessionStorage.removeItem(`pdfText_${pdfKey}`);
    
    console.log(`PDF data with key ${pdfKey} deleted successfully!`);
  } catch (error) {
    console.error(`Error deleting PDF data with key ${pdfKey}:`, error);
    throw error;
  }
};

export const clearPdfData = async () => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pdfData', 'readwrite');
    const store = tx.objectStore('pdfData');
    await store.clear();
    await tx.done;
    
    // Also clear pdfText store
    const textTx = db.transaction('pdfText', 'readwrite');
    const textStore = textTx.objectStore('pdfText');
    await textStore.clear();
    await textTx.done;
    
    console.log('All PDF data cleared successfully!');
  } catch (error) {
    console.error('Error clearing PDF data:', error);
    throw error;
  }
};

export const setCurrentPdf = async (pdfKey: string) => {
  try {
    localStorage.setItem('currentPdfKey', pdfKey);
    console.log('Current PDF key set:', pdfKey);
  } catch (error) {
    console.error('Error setting current PDF key:', error);
    throw error;
  }
};

export const getCurrentPdf = (): string | null => {
  try {
    const key = localStorage.getItem('currentPdfKey');
    console.log('Current PDF key retrieved:', key);
    return key;
  } catch (error) {
    console.error('Error getting current PDF key:', error);
    return null;
  }
};

export const getAllPdfKeys = async (): Promise<string[]> => {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pdfData', 'readonly');
    const store = tx.objectStore('pdfData');
    const keys = await store.getAllKeys();
    await tx.done;
    const stringKeys = keys.map(key => key.toString()).filter(key => !key.endsWith('_text'));
    console.log('All PDF keys retrieved:', stringKeys);
    return stringKeys;
  } catch (error) {
    console.error('Error getting all PDF keys:', error);
    return [];
  }
};

/**
 * Get the text extracted from a PDF by its key
 * @param pdfKey The unique key for the PDF
 * @returns The extracted text from the PDF
 */
export const getPdfText = async (pdfKey: string): Promise<string> => {
  if (!pdfKey) {
    console.warn('No PDF key provided to getPdfText');
    return "";
  }
  
  // Try to get it from sessionStorage first (faster)
  const sessionKey = `pdfText_${pdfKey}`;
  const sessionText = sessionStorage.getItem(sessionKey);
  
  if (sessionText) {
    console.log('PDF text retrieved from sessionStorage:', pdfKey);
    return sessionText;
  }
  
  // If not in sessionStorage, try to get from IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction('pdfText', 'readonly');
    const store = tx.objectStore('pdfText');
    const text = await store.get(pdfKey);
    await tx.done;
    
    if (text) {
      // Store in session storage for faster access next time
      sessionStorage.setItem(sessionKey, text);
      console.log('PDF text retrieved from IndexedDB:', pdfKey);
      return text;
    }
    
    console.warn('No PDF text found for key:', pdfKey);
    return "";
  } catch (error) {
    console.error("Error retrieving PDF text:", error);
    return "";
  }
};
