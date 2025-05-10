
/// <reference types="vite/client" />

// Extend Window interface to include pdfjsWorkerSrc property
declare global {
  interface Window {
    pdfjsWorkerSrc?: string;
    __PDF_FILES__?: File[];
    __ACTIVE_PDF_KEY__?: string | null;
  }
}

export {};
