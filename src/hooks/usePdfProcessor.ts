
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedContent {
  text: string;
}

export const usePdfProcessor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPdf = async (file: File): Promise<ExtractedContent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Read the file as an ArrayBuffer
      const fileData = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileData);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(uint8Array);
      const pdf = await loadingTask.promise;
      
      // Initialize result containers
      let fullText = '';
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      return { text: fullText };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
      setError(errorMessage);
      throw new Error(`Error processing PDF: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processPdf,
    isLoading,
    error
  };
};
