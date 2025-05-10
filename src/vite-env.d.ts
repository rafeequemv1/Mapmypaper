
/// <reference types="vite/client" />

// Extend Window interface to include PDF-related global properties
declare global {
  interface Window {
    pdfjsLib?: any;
    pdfjsWorkerSrc?: string;
    __PDF_FILES__?: File[];
    __ACTIVE_PDF_KEY__?: string | null;
    __PDF_LOAD_ERROR__?: string | null;
    __PDF_WORKER_LOADED__?: boolean; // Track if the worker is loaded successfully
    __PDF_WORKER_LOAD_ATTEMPTS__?: number; // Track load attempts for the worker
  }
}

export {};
