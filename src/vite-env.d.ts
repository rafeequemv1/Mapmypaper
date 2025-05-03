
/// <reference types="vite/client" />

// Declare custom properties on the Window interface
interface Window {
  __PDF_FILES__?: File[];
  __ACTIVE_PDF_KEY__?: string | null;
}
