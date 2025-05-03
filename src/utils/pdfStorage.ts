
// Function that gets all PDF keys from IndexedDB
export async function getAllPdfKeys(): Promise<string[]> {
  // Open the database
  const db = await openDB();
  
  // Get all keys from the PDF store
  const transaction = db.transaction('pdfs', 'readonly');
  const store = transaction.objectStore('pdfs');
  const keys = await store.getAllKeys();
  
  // Convert all keys to strings to fix type mismatch
  return keys.map(key => String(key));
}
