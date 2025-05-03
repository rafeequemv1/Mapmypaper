
/// <reference types="vite/client" />

// Declare custom properties on the Window interface
interface Window {
  __PDF_FILES__?: File[];
  __ACTIVE_PDF_KEY__?: string | null;
}

// Declare environment variable types for TypeScript
interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
