
import { IDBPDatabase, openDB as idbOpenDB } from 'idb';

// Database setup
const DB_NAME = 'pdf_storage';
const DB_VERSION = 1;
const PDF_STORE = 'pdfs';
const CURRENT_PDF_KEY = 'currentPdfKey';

// Helper function to open the database
async function openDB(): Promise<IDBPDatabase> {
  return idbOpenDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the PDF store if it doesn't exist
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE);
      }
    },
  });
}

// Store PDF data with a unique key
export async function storePdfData(key: string, pdfData: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readwrite');
  const store = tx.objectStore(PDF_STORE);
  await store.put(pdfData, key);
  await tx.done;
}

// Get PDF data by key
export async function getPdfData(key: string): Promise<string | undefined> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readonly');
  const store = tx.objectStore(PDF_STORE);
  const data = await store.get(key);
  return data as string | undefined;
}

// Set the current active PDF key
export async function setCurrentPdf(key: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readwrite');
  const store = tx.objectStore(PDF_STORE);
  await store.put(key, CURRENT_PDF_KEY);
  await tx.done;
}

// Get the current active PDF key
export async function getCurrentPdf(): Promise<string | undefined> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readonly');
  const store = tx.objectStore(PDF_STORE);
  const key = await store.get(CURRENT_PDF_KEY);
  return key as string | undefined;
}

// Get all PDF keys from the store
export async function getAllPdfKeys(): Promise<string[]> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readonly');
  const store = tx.objectStore(PDF_STORE);
  const keys = await store.getAllKeys();
  
  // Filter out the special CURRENT_PDF_KEY and convert all remaining keys to strings
  return keys
    .filter(key => key !== CURRENT_PDF_KEY)
    .map(key => String(key));
}

// Get extracted text for a PDF (from sessionStorage)
export async function getPdfText(pdfKey: string): Promise<string> {
  const textKey = `pdfText_${pdfKey}`;
  const text = sessionStorage.getItem(textKey);
  
  if (!text) {
    throw new Error(`No text found for PDF with key: ${pdfKey}`);
  }
  
  return text;
}

// Delete a PDF by key
export async function deletePdf(key: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readwrite');
  const store = tx.objectStore(PDF_STORE);
  await store.delete(key);
  await tx.done;
  
  // Also remove from sessionStorage if exists
  sessionStorage.removeItem(`pdfText_${key}`);
  sessionStorage.removeItem(`pdfMeta_${key}`);
  sessionStorage.removeItem(`mindMapData_${key}`);
}

// Check if a PDF exists by key
export async function pdfExists(key: string): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction(PDF_STORE, 'readonly');
  const store = tx.objectStore(PDF_STORE);
  const count = await store.count(key);
  return count > 0;
}
