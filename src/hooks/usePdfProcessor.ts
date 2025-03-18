
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedImage {
  id: string;
  data: string; // base64 image data
  pageNumber: number;
  width: number;
  height: number;
}

export interface ExtractedContent {
  text: string;
  images: ExtractedImage[];
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
      const images: ExtractedImage[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
        
        // Extract images
        const operatorList = await page.getOperatorList();
        const imgIndex = operatorList.fnArray.indexOf(pdfjsLib.OPS.paintImageXObject);
        
        if (imgIndex !== -1) {
          for (let i = 0; i < operatorList.fnArray.length; i++) {
            if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
              const imgArg = operatorList.argsArray[i][0];
              
              if (imgArg) {
                try {
                  // Get the image data
                  const objs = page.objs.get(imgArg);
                  
                  if (objs && objs.src) {
                    // Create a canvas to draw the image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                      // Set canvas dimensions to match image
                      canvas.width = objs.width;
                      canvas.height = objs.height;
                      
                      // Draw the image on the canvas
                      ctx.drawImage(objs, 0, 0);
                      
                      // Convert to base64
                      const imageData = canvas.toDataURL('image/png');
                      
                      // Add to images array
                      images.push({
                        id: `img_${pageNum}_${i}`,
                        data: imageData,
                        pageNumber: pageNum,
                        width: objs.width,
                        height: objs.height
                      });
                    }
                  }
                } catch (err) {
                  console.warn('Failed to extract image:', err);
                }
              }
            }
          }
        }
      }
      
      return { text: fullText, images };
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
