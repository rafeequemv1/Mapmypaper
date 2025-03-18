
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Need to set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedImage {
  id: string;
  base64Data: string;
  width: number;
  height: number;
  pageNumber: number;
}

export const usePdfImageExtractor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);

  const extractImagesFromPdf = async (file: File): Promise<ExtractedImage[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const images: ExtractedImage[] = [];
      
      // Iterate through each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        
        // Extract images from the page
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          const fn = operatorList.fnArray[i];
          
          // Check if the operator is for drawing an image
          if (fn === pdfjsLib.OPS.paintImageXObject || 
              fn === pdfjsLib.OPS.paintInlineImageXObject) {
            const args = operatorList.argsArray[i];
            const name = args[0];
            
            // Get the image from the objs
            const objs = await page.objs.get(name);
            
            if (objs && objs.data) {
              // Create a canvas to draw the image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) continue;
              
              // Set canvas size to image dimensions
              canvas.width = objs.width;
              canvas.height = objs.height;
              
              // Create an ImageData object
              const imageData = ctx.createImageData(objs.width, objs.height);
              
              // Copy the image data to the ImageData object
              const rgba = imageData.data;
              for (let j = 0, k = 0, jj = objs.data.length; j < jj; j++, k += 4) {
                rgba[k] = objs.data[j]; // R
                rgba[k + 1] = objs.data[j]; // G
                rgba[k + 2] = objs.data[j]; // B
                rgba[k + 3] = 255; // A
              }
              
              // Put the ImageData on the canvas
              ctx.putImageData(imageData, 0, 0);
              
              // Convert canvas to base64
              const base64Data = canvas.toDataURL('image/png');
              
              // Add to images array if it's not too small (to filter out icons)
              if (objs.width > 100 && objs.height > 100) {
                images.push({
                  id: `img_${pageNum}_${i}`,
                  base64Data,
                  width: objs.width,
                  height: objs.height,
                  pageNumber: pageNum
                });
              }
            }
          }
        }
      }
      
      setExtractedImages(images);
      return images;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract images from PDF';
      setError(errorMessage);
      console.error('PDF Image extraction error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    extractImagesFromPdf,
    extractedImages,
    isLoading,
    error
  };
};
