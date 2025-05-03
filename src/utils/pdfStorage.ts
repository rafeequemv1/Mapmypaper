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
