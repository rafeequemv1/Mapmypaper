
import { openDB as openIDB, IDBPDatabase } from 'idb';

let db: IDBPDatabase | null = null;

const DB_NAME = 'pdf-storage-db';
const DB_VERSION = 1;

// Initialize the database
export const openDB = async () => {
  if (!db) {
    db = await openIDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pdfs')) {
          db.createObjectStore('pdfs', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('current')) {
          db.createObjectStore('current');
        }
        if (!db.objectStoreNames.contains('pdf_text')) {
          db.createObjectStore('pdf_text');
        }
      },
    });
    console.log('Database opened successfully');
  }
  return db;
};

// Store a PDF file
export const storePdf = async (name: string, file: File) => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readwrite');
    const store = tx.objectStore('pdfs');
    await store.put({ name, file });
    await tx.done;
    console.log(`PDF "${name}" stored successfully`);
    return true;
  } catch (error) {
    console.error('Error storing PDF:', error);
    return false;
  }
};

// Store PDF data (as a string, typically base64)
export const storePdfData = async (name: string, data: string) => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readwrite');
    const store = tx.objectStore('pdfs');
    await store.put({ name, data });
    await tx.done;
    console.log(`PDF data for "${name}" stored successfully`);
    return true;
  } catch (error) {
    console.error('Error storing PDF data:', error);
    return false;
  }
};

// Get a PDF file by name
export const getPdf = async (name: string): Promise<File | undefined> => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readonly');
    const store = tx.objectStore('pdfs');
    const pdfData = await store.get(name);
    await tx.done;
    return pdfData ? pdfData.file : undefined;
  } catch (error) {
    console.error('Error getting PDF:', error);
    return undefined;
  }
};

// Get PDF data (string/base64) by name
export const getPdfData = async (name: string): Promise<string | null> => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readonly');
    const store = tx.objectStore('pdfs');
    const pdfData = await store.get(name);
    await tx.done;
    return pdfData && pdfData.data ? pdfData.data : null;
  } catch (error) {
    console.error('Error getting PDF data:', error);
    return null;
  }
};

// Store extracted PDF text
export const storePdfText = async (name: string, text: string) => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdf_text', 'readwrite');
    const store = tx.objectStore('pdf_text');
    await store.put(text, name);
    await tx.done;
    console.log(`Text for PDF "${name}" stored successfully`);
    return true;
  } catch (error) {
    console.error('Error storing PDF text:', error);
    return false;
  }
};

// Get extracted PDF text
export const getPdfText = async (name: string): Promise<string | null> => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdf_text', 'readonly');
    const store = tx.objectStore('pdf_text');
    const text = await store.get(name);
    await tx.done;
    return text || null;
  } catch (error) {
    console.error('Error getting PDF text:', error);
    return null;
  }
};

// Get all PDF keys
export const getAllPdfKeys = async (): Promise<string[]> => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readonly');
    const store = tx.objectStore('pdfs');
    const keys = await store.getAllKeys();
    return keys.map(key => String(key)); // Convert all keys to strings
  } catch (error) {
    console.error('Error getting all PDF keys:', error);
    return [];
  }
};

// Delete a PDF file
export const deletePdf = async (name: string) => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('pdfs', 'readwrite');
    const store = tx.objectStore('pdfs');
    await store.delete(name);
    await tx.done;
    console.log(`PDF "${name}" deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
};

// Set the current PDF
export const setCurrentPdf = async (pdfKey: string) => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('current', 'readwrite');
    const store = tx.objectStore('current');
    await store.put(pdfKey, 'current');
    await tx.done;
    return true;
  } catch (error) {
    console.error('Error setting current PDF:', error);
    return false;
  }
};

// Get the current PDF
export const getCurrentPdf = async (): Promise<string | null> => {
  if (!db) await openDB();
  try {
    const tx = db!.transaction('current', 'readonly');
    const store = tx.objectStore('current');
    const pdfKey = await store.get('current');
    await tx.done;
    return pdfKey || null;
  } catch (error) {
    console.error('Error getting current PDF:', error);
    return null;
  }
};
