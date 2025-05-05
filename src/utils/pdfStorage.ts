
import PdfToText from "react-pdftotext";
import { openDB, IDBPDatabase } from 'idb';

// Define the database name and store name
const DB_NAME = 'pdfStorage';
const STORE_NAME = 'pdfs';
const CURRENT_PDF_KEY = 'currentPdfKey';

// Initialize the database
let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

// Store PDF data in IndexedDB
export const storePdfData = async (key: string, data: string): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, data, key);
  // Mark that this PDF has data stored
  sessionStorage.setItem(`hasPdfData_${key}`, 'true');
};

// Get PDF data from IndexedDB
export const getPdfData = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB();
    const data = await db.get(STORE_NAME, key);
    return data || null;
  } catch (error) {
    console.error("Error retrieving PDF data:", error);
    return null;
  }
};

// Set current PDF key in IndexedDB
export const setCurrentPdfKey = async (key: string): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, key, CURRENT_PDF_KEY);
  window.dispatchEvent(new CustomEvent('currentPdfChanged', { detail: { key } }));
};

// Get current PDF key from IndexedDB
export const getCurrentPdfKey = async (): Promise<string | null> => {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, CURRENT_PDF_KEY);
  } catch (error) {
    console.error("Error getting current PDF key:", error);
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
  }
};

// Check if mind map is ready for a PDF
export const isMindMapReady = (key: string): boolean => {
  return sessionStorage.getItem(`mindMapReady_${key}`) === 'true';
};

// For backward compatibility
export const setCurrentPdf = setCurrentPdfKey;
