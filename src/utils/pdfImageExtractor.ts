
import * as pdfjs from 'pdfjs-dist';

// Define types for extracted images
export interface ExtractedImage {
  data: string;  // Base64 data
  width: number;
  height: number;
  pageNumber: number;
}

/**
 * Extract images from a PDF file
 * @param pdfData The PDF data as a base64 string or URL
 * @returns A promise resolving to array of extracted images
 */
export const extractImagesFromPdf = async (pdfData: string): Promise<ExtractedImage[]> => {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    console.log(`PDF loaded with ${numPages} pages`);
    
    const extractedImages: ExtractedImage[] = [];
    
    // Process each page to extract images
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get the operatorList which contains all operations including images
      const opList = await page.getOperatorList();
      
      // Get all image resource identifiers from fnArray & argsArray
      const imgIndices: number[] = [];
      for (let i = 0; i < opList.fnArray.length; i++) {
        // 83 is the code for "paintImageXObject" operation in PDF.js
        if (opList.fnArray[i] === 83) {
          imgIndices.push(i);
        }
      }
      
      // Extract each image
      for (const idx of imgIndices) {
        const imgName = opList.argsArray[idx][0]; // Get image identifier
        
        try {
          // Get the image object
          const img = await page.objs.get(imgName);
          if (!img || !img.data) continue;
          
          // Get image dimensions
          const width = img.width || 200;
          const height = img.height || 200;
          
          // Convert to base64 if it's not already
          let imageData: string;
          
          if (img.data instanceof Uint8Array) {
            // Convert to base64
            const blob = new Blob([img.data.buffer], { type: 'image/png' });
            const reader = new FileReader();
            
            imageData = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } else if (typeof img.data === 'string') {
            imageData = img.data;
          } else {
            console.warn(`Unsupported image data type for image: ${imgName}`);
            continue;
          }
          
          // Add to extracted images array
          extractedImages.push({
            data: imageData,
            width,
            height,
            pageNumber: pageNum,
          });
          
          console.log(`Extracted image from page ${pageNum}, dimensions: ${width}x${height}`);
        } catch (error) {
          console.error(`Error extracting image ${imgName} from page ${pageNum}:`, error);
        }
      }
    }
    
    return extractedImages;
  } catch (error) {
    console.error("Error extracting images from PDF:", error);
    throw error;
  }
};

// Helper to get a reasonable display size for images, maintaining aspect ratio
export const getDisplayImageSize = (originalWidth: number, originalHeight: number, maxWidth = 200, maxHeight = 200): {width: number, height: number} => {
  // Check if the image is already smaller than the max dimensions
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }
  
  // Calculate the aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  // Calculate dimensions based on aspect ratio
  let newWidth = maxWidth;
  let newHeight = maxWidth / aspectRatio;
  
  // If the height is still too large, scale based on height instead
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
};
