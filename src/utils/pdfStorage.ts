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
}

async function openDBInstance() {
  return openDB<PDFDB>('pdfs-db', 1, {
    upgrade(db) {
      db.createObjectStore('pdfs', { keyPath: 'name' });
    },
  });
}

export async function storePdf(name: string, data: ArrayBuffer, size: number, lastModified: number) {
  try {
    const db = await openDBInstance();
    await db.put('pdfs', { name, data, size, lastModified });
    console.log('PDF stored successfully:', name);
  } catch (error) {
    console.error('Error storing PDF:', error);
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
