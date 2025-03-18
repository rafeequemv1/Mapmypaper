
import { useState } from 'react';
import * as PDFToText from 'react-pdftotext';

export const usePdfTextExtractor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert the PDF file to text using react-pdftotext
      const text = await PDFToText.default(file);
      
      return text;
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
