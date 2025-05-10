
import * as pdfjs from 'pdfjs-dist';

// Set up the PDF.js worker
function setupPdfWorker() {
  // Only set the worker once
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // Use the CDN worker that matches our installed version
    const pdfJsVersion = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
    console.log(`PDF.js worker set to version: ${pdfJsVersion}`);
  }
}

// Initialize worker when the module is imported
setupPdfWorker();

/**
 * Extract images from a PDF file
 * @param pdfData PDF data as a data URL or ArrayBuffer
 * @returns Array of extracted images as data URLs with metadata
 */
export async function extractImagesFromPdf(pdfData: string | ArrayBuffer): Promise<ExtractedImage[]> {
  const extractedImages: ExtractedImage[] = [];
  
  try {
    // Ensure worker is set up
    setupPdfWorker();
    
    // If PDF data is a data URL, convert it to ArrayBuffer
    let pdfBuffer: ArrayBuffer;
    if (typeof pdfData === 'string' && pdfData.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfData.split(',')[1];
      pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
    } else if (pdfData instanceof ArrayBuffer) {
      pdfBuffer = pdfData;
    } else {
      throw new Error('Invalid PDF data format');
    }

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    // Iterate through all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const operatorList = await page.getOperatorList();
      
      // Process page content to find image objects
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fnId = operatorList.fnArray[i];
        // Check if the operator is for painting an image
        if (fnId === pdfjs.OPS.paintImageXObject || 
            fnId === pdfjs.OPS.paintInlineImageXObject) {
          const imageArgs = operatorList.argsArray[i];
          const imageId = imageArgs[0];
          
          // Get the image data for the identified image
          const imgData = await page.objs.get(imageId);
          
          if (imgData && imgData.width && imgData.height && imgData.data) {
            // Check if image is large enough to be meaningful (skip tiny images/icons)
            if (imgData.width >= 50 && imgData.height >= 50) {
              try {
                // Convert the image data to canvas and then to data URL
                const canvas = document.createElement('canvas');
                canvas.width = imgData.width;
                canvas.height = imgData.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Create ImageData from the raw pixel data
                  const imageData = new ImageData(
                    new Uint8ClampedArray(imgData.data),
                    imgData.width,
                    imgData.height
                  );
                  
                  ctx.putImageData(imageData, 0, 0);
                  
                  // Convert to data URL
                  const dataUrl = canvas.toDataURL('image/png');
                  
                  // Add to extracted images
                  extractedImages.push({
                    id: `page${pageNum}_img${extractedImages.length}`,
                    url: dataUrl,
                    alt: `Image from page ${pageNum}`,
                    pageNumber: pageNum,
                    width: imgData.width,
                    height: imgData.height,
                  });
                }
              } catch (err) {
                console.error('Error processing image:', err);
              }
            }
          }
        }
      }
    }

    console.log(`Extracted ${extractedImages.length} images from PDF`);
    return extractedImages;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    return [];
  }
}

// Type for extracted image data
export interface ExtractedImage {
  id: string;
  url: string;
  alt: string;
  pageNumber: number;
  width: number;
  height: number;
}

// Store extracted images in session storage
export function storeExtractedImages(pdfKey: string, images: ExtractedImage[]): void {
  try {
    sessionStorage.setItem(`pdfImages_${pdfKey}`, JSON.stringify(images));
  } catch (error) {
    console.error('Error storing extracted images:', error);
    // If the data is too large, try storing a subset
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const reducedImages = images.slice(0, Math.max(10, Math.floor(images.length / 2)));
      try {
        sessionStorage.setItem(`pdfImages_${pdfKey}`, JSON.stringify(reducedImages));
        console.log('Stored reduced set of images due to storage limitations');
      } catch (subError) {
        console.error('Failed to store even reduced set of images:', subError);
      }
    }
  }
}

// Retrieve extracted images from session storage
export function getExtractedImages(pdfKey: string): ExtractedImage[] {
  try {
    const storedImages = sessionStorage.getItem(`pdfImages_${pdfKey}`);
    return storedImages ? JSON.parse(storedImages) : [];
  } catch (error) {
    console.error('Error retrieving extracted images:', error);
    return [];
  }
}

// Clear extracted images from session storage
export function clearExtractedImages(pdfKey: string): void {
  try {
    sessionStorage.removeItem(`pdfImages_${pdfKey}`);
  } catch (error) {
    console.error('Error clearing extracted images:', error);
  }
}
