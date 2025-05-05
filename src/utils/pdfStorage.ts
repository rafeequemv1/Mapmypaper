
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

// Define our database schema
interface PdfDB extends DBSchema {
  pdfs: {
    key: string;
    value: {
      text: string;
      metadata: {
        name: string;
        size: number;
        lastModified: number;
      };
    };
  };
}

// Database name and version
const DB_NAME = 'pdf-storage';
const DB_VERSION = 1;

// Initialize database
async function getDb(): Promise<IDBPDatabase<PdfDB>> {
  return openDB<PdfDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for PDF data if it doesn't exist
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs');
      }
    },
  });
}

// Store PDF data in IndexedDB
export async function storePdfData(pdfKey: string, text: string, metadata: { name: string; size: number; lastModified: number }): Promise<void> {
  try {
    const db = await getDb();
    await db.put('pdfs', { text, metadata }, pdfKey);
    
    // Also update sessionStorage for compatibility with existing code
    sessionStorage.setItem(`pdfText_${pdfKey}`, text);
    sessionStorage.setItem(`pdfMeta_${pdfKey}`, JSON.stringify(metadata));
    
    // If this is the currently active PDF, update the main pdfText item too
    const currentPdfKey = sessionStorage.getItem('currentPdfKey');
    if (currentPdfKey === pdfKey) {
      sessionStorage.setItem('pdfText', text);
    }
  } catch (error) {
    console.error('Error storing PDF data:', error);
    throw error;
  }
}

// Get PDF data from IndexedDB
export async function getPdfData(pdfKey: string): Promise<string> {
  try {
    const db = await getDb();
    const data = await db.get('pdfs', pdfKey);
    return data?.text || '';
  } catch (error) {
    console.error('Error retrieving PDF data:', error);
    // Fall back to sessionStorage if IndexedDB fails
    return sessionStorage.getItem(`pdfText_${pdfKey}`) || '';
  }
}

// Get current PDF data
export async function getCurrentPdfData(): Promise<string | null> {
  const currentPdfKey = sessionStorage.getItem('currentPdfKey');
  if (!currentPdfKey) {
    // If no current key, try to fall back to general pdfText
    return sessionStorage.getItem('pdfText');
  }
  
  return getPdfData(currentPdfKey);
}

// Function to check if a mindmap has been generated
export function isMindMapReady(): boolean {
  return sessionStorage.getItem('mindMapGenerated') === 'true';
}

// Enhanced function to get text from all PDFs
export async function getAllPdfText(): Promise<string> {
  try {
    const pdfs = getAllPdfs();
    let allText = "";
    
    // First try to get text from IndexedDB
    const db = await getDb();
    
    for (const pdf of pdfs) {
      const key = getPdfKey(pdf);
      try {
        // Try to get from IndexedDB first
        const data = await db.get('pdfs', key);
        if (data && data.text) {
          allText += `\n\n=== PDF: ${pdf.name} ===\n\n`;
          allText += data.text;
        } else {
          // Fall back to sessionStorage
          const text = sessionStorage.getItem(`pdfText_${key}`);
          if (text) {
            allText += `\n\n=== PDF: ${pdf.name} ===\n\n`;
            allText += text;
          }
        }
      } catch (e) {
        console.error(`Error retrieving PDF data for ${pdf.name}:`, e);
      }
    }
    
    console.log(`Retrieved text from ${pdfs.length} PDFs`);
    
    if (!allText.trim()) {
      // If no PDFs were found in either IndexedDB or sessionStorage
      // Try to get the current PDF text as fallback
      const currentPdfText = sessionStorage.getItem('pdfText');
      if (currentPdfText && currentPdfText.trim()) {
        allText = currentPdfText;
      }
    }
    
    return allText;
  } catch (error) {
    console.error('Error getting all PDF text:', error);
    // Fallback to current PDF text if anything goes wrong
    return sessionStorage.getItem('pdfText') || "";
  }
}

// Update the current PDF key
export function setCurrentPdfKey(key: string): void {
  sessionStorage.setItem('currentPdfKey', key);
}
