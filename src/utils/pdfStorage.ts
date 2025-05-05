
import PdfToText from "react-pdftotext";
import { openDB, IDBPDatabase } from 'idb';

// Define the database name and store name
const DB_NAME = 'pdfStorage';
const STORE_NAME = 'pdfs';
const CURRENT_PDF_KEY = 'currentPdfKey';
const DB_VERSION = 1; // Version for better control over database schema

// Initialize the database
let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = async () => {
  if (!dbPromise) {
    // Close any existing connection first to avoid blocking
    try {
      const existingDb = await window.indexedDB.open(DB_NAME);
      existingDb.close();
    } catch (e) {
      console.log("No existing database connection to close");
    }
    
    console.log(`Initializing IndexedDB: ${DB_NAME}, store: ${STORE_NAME}, version: ${DB_VERSION}`);
    
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);
        
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log(`Creating object store: ${STORE_NAME}`);
          db.createObjectStore(STORE_NAME);
        } else {
          console.log(`Object store ${STORE_NAME} already exists`);
        }
      },
      blocking(currentVersion, blockedVersion, event) {
        console.log(`Database blocking event: current version ${currentVersion}, blocked version ${blockedVersion}`);
        // Handle blocking events if needed
      },
      terminated() {
        console.log('Database connection terminated unexpectedly');
        dbPromise = null; // Reset the promise so we try to reconnect next time
      }
    });
  }
  return dbPromise;
};

// Helper to verify object store exists
const verifyObjectStore = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    transaction.done.catch(err => {
      console.error("Transaction verification failed:", err);
      return false;
    });
    return true;
  } catch (error) {
    console.error("Object store verification failed:", error);
    return false;
  }
};

// Store PDF data in IndexedDB
export const storePdfData = async (key: string, data: string): Promise<void> => {
  try {
    const db = await initDB();
    
    // Verify the object store exists before proceeding
    if (!(await verifyObjectStore())) {
      throw new Error(`Object store ${STORE_NAME} not found. Database may need to be recreated.`);
    }
    
    await db.put(STORE_NAME, data, key);
    // Mark that this PDF has data stored
    sessionStorage.setItem(`hasPdfData_${key}`, 'true');
    console.log(`PDF data stored successfully for key: ${key}`);
  } catch (error) {
    console.error("Error storing PDF data:", error);
    
    // If the error is related to object store not found, attempt to fix by deleting and recreating DB
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log("Attempting to fix IndexedDB by recreating...");
      try {
        // Reset the dbPromise to force recreation on next access
        dbPromise = null;
        await initDB(); // Re-initialize the database
        
        // Retry the operation
        const db = await initDB();
        await db.put(STORE_NAME, data, key);
        sessionStorage.setItem(`hasPdfData_${key}`, 'true');
        console.log("Successfully recovered from IndexedDB error");
      } catch (recoveryError) {
        console.error("Recovery attempt failed:", recoveryError);
        throw recoveryError;
      }
    } else {
      throw error; // Re-throw to allow handling by caller
    }
  }
};

// Get PDF data from IndexedDB
export const getPdfData = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB();
    
    // Verify the object store exists before proceeding
    if (!(await verifyObjectStore())) {
      console.warn(`Object store ${STORE_NAME} not found when getting PDF data.`);
      return null;
    }
    
    const data = await db.get(STORE_NAME, key);
    return data || null;
  } catch (error) {
    console.error("Error retrieving PDF data:", error);
    
    // Handle object store not found error
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log("Object store not found. Attempting to initialize DB again...");
      dbPromise = null; // Reset DB connection
      await initDB(); // Re-initialize
      return null;
    }
    
    return null;
  }
};

// Set current PDF key in IndexedDB
export const setCurrentPdfKey = async (key: string): Promise<void> => {
  try {
    const db = await initDB();
    
    // Verify the object store exists before proceeding
    if (!(await verifyObjectStore())) {
      throw new Error(`Object store ${STORE_NAME} not found when setting current PDF key.`);
    }
    
    await db.put(STORE_NAME, key, CURRENT_PDF_KEY);
    window.dispatchEvent(new CustomEvent('currentPdfChanged', { detail: { key } }));
    console.log(`Current PDF key set to: ${key}`);
  } catch (error) {
    console.error("Error setting current PDF key:", error);
    
    // Handle object store not found error
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log("Object store not found. Attempting to initialize DB again...");
      dbPromise = null; // Reset DB connection
      await initDB(); // Re-initialize
      
      // Retry the operation
      const db = await initDB();
      await db.put(STORE_NAME, key, CURRENT_PDF_KEY);
      window.dispatchEvent(new CustomEvent('currentPdfChanged', { detail: { key } }));
    } else {
      throw error;
    }
  }
};

// Get current PDF key from IndexedDB
export const getCurrentPdfKey = async (): Promise<string | null> => {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, CURRENT_PDF_KEY);
  } catch (error) {
    console.error("Error getting current PDF key:", error);
    
    // Handle object store not found error
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log("Object store not found. Attempting to initialize DB again...");
      dbPromise = null; // Reset DB connection
      await initDB(); // Re-initialize
    }
    
    return null;
  }
};

// Get current PDF data from IndexedDB
export const getCurrentPdfData = async (): Promise<string | null> => {
  try {
    const key = await getCurrentPdfKey();
    if (!key) return null;
    return await getPdfData(key);
  } catch (error) {
    console.error("Error getting current PDF data:", error);
    return null;
  }
};

// Extract text from current PDF
export const getPdfText = async (): Promise<string> => {
  try {
    const pdfData = await getCurrentPdfData();
    if (!pdfData) return "";
    
    // Convert data URL to Blob
    const byteString = atob(pdfData.split(',')[1]);
    const mimeType = pdfData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], "current.pdf", { type: mimeType });
    
    // Use PdfToText to extract text
    const text = await PdfToText(file);
    return text || "";
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "";
  }
};

// Clear PDF data from IndexedDB
export const clearPdfData = async (key: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
    // Clear session storage markers
    sessionStorage.removeItem(`hasPdfData_${key}`);
    sessionStorage.removeItem(`mindMapReady_${key}`);
    
    // If we're deleting the current PDF, reset the current key
    const currentKey = await getCurrentPdfKey();
    if (currentKey === key) {
      await setCurrentPdfKey('');
    }
  } catch (error) {
    console.error("Error clearing PDF data:", error);
    
    // Handle object store not found error
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      console.log("Object store not found when clearing PDF data.");
      // Clean session storage even if DB operation fails
      sessionStorage.removeItem(`hasPdfData_${key}`);
      sessionStorage.removeItem(`mindMapReady_${key}`);
    }
  }
};

// Check if mind map is ready for a PDF
export const isMindMapReady = (key: string): boolean => {
  return sessionStorage.getItem(`mindMapReady_${key}`) === 'true';
};

// For backward compatibility
export const setCurrentPdf = setCurrentPdfKey;

