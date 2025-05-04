import React from 'react';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

// Placeholder component - this will likely be overridden by the read-only implementation
const PdfViewer = () => {
  return (
    <div className="pdf-viewer">PDF Viewer Component</div>
  );
};

export default PdfViewer;
