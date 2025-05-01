import { openDB } from 'idb';

interface PdfMeta {
  name: string;
  size: number;
  lastModified: number;
}

const DB_NAME = 'pdfDB';
const DB_VERSION = 1;

const openDatabase = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pdfData')) {
        db.createObjectStore('pdfData');
      }
    },
  });
};

export const storePdfData = async (pdfKey: string, data: string) => {
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readwrite');
  const store = tx.objectStore('pdfData');
  await store.put(data, pdfKey);
  await tx.done;
  console.log('PDF data stored successfully!');
};

export const getPdfData = async (pdfKey: string): Promise<string | undefined> => {
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readonly');
  const store = tx.objectStore('pdfData');
  const pdfData = await store.get(pdfKey);
  await tx.done;
  return pdfData;
};

export const deletePdfData = async (pdfKey: string) => {
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readwrite');
  const store = tx.objectStore('pdfData');
  await store.delete(pdfKey);
  await tx.done;
  console.log(`PDF data with key ${pdfKey} deleted successfully!`);
};

export const clearPdfData = async () => {
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readwrite');
  const store = tx.objectStore('pdfData');
  await store.clear();
  await tx.done;
  console.log('All PDF data cleared successfully!');
};

export const setCurrentPdf = async (pdfKey: string) => {
  localStorage.setItem('currentPdfKey', pdfKey);
};

export const getCurrentPdf = (): string | null => {
  return localStorage.getItem('currentPdfKey');
};

export const getAllPdfKeys = async (): Promise<string[]> => {
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readonly');
  const store = tx.objectStore('pdfData');
  const keys = await store.getAllKeys();
  await tx.done;
  return keys.map(key => key.toString()).filter(key => !key.endsWith('_text'));
};

/**
 * Get the text extracted from a PDF by its key
 * @param pdfKey The unique key for the PDF
 * @returns The extracted text from the PDF
 */
export const getPdfText = async (pdfKey: string): Promise<string> => {
  // Try to get it from sessionStorage first (this is where PdfToText stores it)
  const sessionKey = `pdfText_${pdfKey}`;
  const sessionText = sessionStorage.getItem(sessionKey);
  
  if (sessionText) {
    return sessionText;
  }
  
  // If not in sessionStorage, try to get from IndexedDB
  const db = await openDatabase();
  const tx = db.transaction('pdfData', 'readonly');
  const store = tx.objectStore('pdfData');
  
  try {
    const record = await store.get(`${pdfKey}_text`);
    if (record && record.data) {
      return record.data;
    }
  } catch (error) {
    console.error("Error retrieving PDF text from IndexedDB:", error);
  }
  
  return "";
};
