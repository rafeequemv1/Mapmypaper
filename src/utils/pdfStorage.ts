
import { openDB, DBSchema } from 'idb';

interface PDFDB extends DBSchema {
  pdfs: {
    key: string;
    value: {
      name: string;
      data: ArrayBuffer;
      size: number;
      lastModified: number;
    };
  };
  current: {
    key: string;
    value: {
      id: string;
      value: string;
    };
  };
}

async function openDBInstance() {
  return openDB<PDFDB>('pdfs-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs', { keyPath: 'name' });
      }
      
      // Create a store for the current PDF reference
      if (!db.objectStoreNames.contains('current')) {
        db.createObjectStore('current', { keyPath: 'id' });
      }
    },
  });
}

// Original function - store PDF with ArrayBuffer data
export async function storePdf(name: string, data: ArrayBuffer, size: number, lastModified: number) {
  try {
    const db = await openDBInstance();
    await db.put('pdfs', { name, data, size, lastModified });
    console.log('PDF stored successfully:', name);
  } catch (error) {
    console.error('Error storing PDF:', error);
  }
}

// New function - store PDF with data URL (compatible with the components that expect this)
export async function storePdfData(pdfKey: string, dataUrl: string) {
  try {
    // Convert data URL to ArrayBuffer if needed
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Extract metadata from the key (format: name_size_lastModified)
    const keyParts = pdfKey.split('_');
    const name = pdfKey;
    const size = parseInt(keyParts[keyParts.length - 2]) || 0;
    const lastModified = parseInt(keyParts[keyParts.length - 1]) || Date.now();
    
    // Store using the original function
    await storePdf(name, arrayBuffer, size, lastModified);
    
    // Store the key as "has PDF data" marker in sessionStorage for quick checks
    sessionStorage.setItem(`hasPdfData_${pdfKey}`, 'true');
    
    return true;
  } catch (error) {
    console.error('Error storing PDF data:', error);
    return false;
  }
}

export async function getPdfData(name: string): Promise<ArrayBuffer | undefined> {
  try {
    const db = await openDBInstance();
    const pdf = await db.get('pdfs', name);
    return pdf?.data;
  } catch (error) {
    console.error('Error getting PDF data:', error);
    return undefined;
  }
}

// Get PDF as data URL (for browser viewing)
export async function getPdfUrl(name: string): Promise<string | undefined> {
  try {
    const arrayBuffer = await getPdfData(name);
    if (!arrayBuffer) return undefined;
    
    // Convert ArrayBuffer to data URL
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    return undefined;
  }
}

export async function deletePdf(name: string) {
  try {
    const db = await openDBInstance();
    await db.delete('pdfs', name);
    console.log('PDF deleted successfully:', name);
  } catch (error) {
    console.error('Error deleting PDF:', error);
  }
}

export async function getAllPdfKeys(): Promise<string[]> {
  try {
    const db = await openDBInstance();
    const store = db.transaction('pdfs', 'readonly').objectStore('pdfs');
    const keys = await store.getAllKeys();
    return keys.map(key => key.toString()); // Convert IDBValidKey[] to string[]
  } catch (error) {
    console.error('Error getting all PDF keys:', error);
    return [];
  }
}

// Set the current PDF for viewing
export async function setCurrentPdf(pdfKey: string) {
  try {
    const db = await openDBInstance();
    // Fix: Store the current PDF key with the correct object structure
    await db.put('current', { id: 'currentPdf', value: pdfKey });
    
    // Also update sessionStorage for faster access
    sessionStorage.setItem('currentPdfKey', pdfKey);
    
    console.log('Current PDF set:', pdfKey);
    return true;
  } catch (error) {
    console.error('Error setting current PDF:', error);
    return false;
  }
}

// Get the current PDF key
export async function getCurrentPdf(): Promise<string | null> {
  try {
    // Try sessionStorage first for faster access
    const sessionKey = sessionStorage.getItem('currentPdfKey');
    if (sessionKey) return sessionKey;
    
    // Fall back to IndexedDB
    const db = await openDBInstance();
    // Fix: Get the current record as the defined interface type
    const current = await db.get('current', 'currentPdf');
    return current?.value || null;
  } catch (error) {
    console.error('Error getting current PDF:', error);
    return null;
  }
}

// Helper to get PDF text (looking in sessionStorage)
export async function getPdfText(pdfKey: string): Promise<string | null> {
  try {
    const text = sessionStorage.getItem(`pdfText_${pdfKey}`);
    return text;
  } catch (error) {
    console.error('Error getting PDF text:', error);
    return null;
  }
}
