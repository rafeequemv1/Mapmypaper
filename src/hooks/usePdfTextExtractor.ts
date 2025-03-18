
import * as pdfjsLib from 'pdfjs-dist';
import { useState } from 'react';

// Set worker path relative to our application
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const usePdfTextExtractor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Read the file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => 
          'str' in item ? item.str : ''
        );
        fullText += textItems.join(' ') + '\n\n';
      }
      
      return fullText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract text from PDF';
      setError(errorMessage);
      return `Error extracting text: ${errorMessage}`;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    extractTextFromPdf,
    isLoading,
    error
  };
};
