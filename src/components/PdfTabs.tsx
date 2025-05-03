import React from 'react';

export interface PdfInfo {
  name: string;
  size: number;
  lastModified: number;
}

export function getAllPdfs(): PdfInfo[] {
  // Get PDF keys from sessionStorage
  const keys = Object.keys(sessionStorage)
    .filter(key => key.startsWith('pdfMeta_'))
    .map(key => key.replace('pdfMeta_', ''));
  
  // Get PDF metadata
  return keys
    .map(key => {
      try {
        const metaString = sessionStorage.getItem(`pdfMeta_${key}`);
        if (metaString) {
          return JSON.parse(metaString);
        }
        return null;
      } catch {
        return null;
      }
    })
    .filter((item): item is PdfInfo => !!item);
}

export default function PdfTabs() {
  // This is a placeholder component, implementation would depend on how you want to display PDF tabs
  return <div>PDF Tabs</div>;
}
