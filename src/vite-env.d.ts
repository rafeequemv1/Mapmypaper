
/// <reference types="vite/client" />

// Extend Window interface to include PDF-related global properties
declare global {
  interface Window {
    pdfjsLib?: any;
    pdfjsWorkerSrc?: string;
    __PDF_FILES__?: File[];
    __ACTIVE_PDF_KEY__?: string | null;
    __PDF_LOAD_ERROR__?: string | null; // Add tracking for PDF load errors
  }
}

export {};
