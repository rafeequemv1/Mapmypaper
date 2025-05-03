
import { openDB } from 'idb';

// Database name and version
const DB_NAME = 'pdf_storage_db';
const DB_VERSION = 1;
const PDF_STORE = 'pdf_files';
const PDF_TEXT_STORE = 'pdf_text';
const CURRENT_PDF_KEY = 'current_pdf_key';

// Initialize the database
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for PDF data
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE);
      }
      
      // Create a store for PDF text
      if (!db.objectStoreNames.contains(PDF_TEXT_STORE)) {
        db.createObjectStore(PDF_TEXT_STORE);
      }
    }
  });
}

// Store PDF data in IndexedDB
export async function storePdfData(key: string, data: string) {
  try {
    const db = await initDB();
    await db.put(PDF_STORE, data, key);
    console.log(`PDF data stored with key: ${key}`);
    return true;
  } catch (error) {
    console.error('Error storing PDF data:', error);
    return false;
  }
}

// Store PDF text in IndexedDB
export async function storePdfText(key: string, text: string) {
  try {
    const db = await initDB();
    await db.put(PDF_TEXT_STORE, text, key);
    console.log(`PDF text stored with key: ${key}`);
    return true;
  } catch (error) {
    console.error('Error storing PDF text:', error);
    return false;
  }
}

// Get PDF data from IndexedDB
export async function getPdfData(key: string): Promise<string | null> {
  try {
    const db = await initDB();
    const data = await db.get(PDF_STORE, key);
    if (data) {
      console.log('PDF data loaded successfully from IndexedDB');
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving PDF data:', error);
    return null;
  }
}

// Get PDF text from IndexedDB or sessionStorage
export async function getPdfText(key: string): Promise<string | null> {
  try {
    // First check sessionStorage for quick access
    const sessionText = sessionStorage.getItem(`pdfText_${key}`);
    if (sessionText) {
      console.log('PDF text loaded from sessionStorage');
      return sessionText;
    }
    
    // If not found in sessionStorage, try IndexedDB
    const db = await initDB();
    const text = await db.get(PDF_TEXT_STORE, key);
    if (text) {
      console.log('PDF text loaded successfully from IndexedDB');
      return text;
    }
    
    console.warn(`No PDF text found for key: ${key}`);
    return null;
  } catch (error) {
    console.error('Error retrieving PDF text:', error);
    return null;
  }
}

// Set current PDF key
export async function setCurrentPdf(key: string) {
  try {
    localStorage.setItem(CURRENT_PDF_KEY, key);
    console.log(`Current PDF set to: ${key}`);
    return true;
  } catch (error) {
    console.error('Error setting current PDF:', error);
    return false;
  }
}

// Get current PDF key
export async function getCurrentPdf(): Promise<string | null> {
  try {
    const key = localStorage.getItem(CURRENT_PDF_KEY);
    return key;
  } catch (error) {
    console.error('Error getting current PDF:', error);
    return null;
  }
}

// Get all PDF keys
export async function getAllPdfKeys(): Promise<string[]> {
  try {
    const db = await initDB();
    return await db.getAllKeys(PDF_STORE);
  } catch (error) {
    console.error('Error getting all PDF keys:', error);
    return [];
  }
}

// Delete PDF data
export async function deletePdf(key: string): Promise<boolean> {
  try {
    const db = await initDB();
    await db.delete(PDF_STORE, key);
    await db.delete(PDF_TEXT_STORE, key);
    
    // Remove from sessionStorage too
    sessionStorage.removeItem(`pdfText_${key}`);
    sessionStorage.removeItem(`pdfMeta_${key}`);
    sessionStorage.removeItem(`mindMapData_${key}`);
    
    // If this was the current PDF, clear that setting
    const currentKey = await getCurrentPdf();
    if (currentKey === key) {
      localStorage.removeItem(CURRENT_PDF_KEY);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}
