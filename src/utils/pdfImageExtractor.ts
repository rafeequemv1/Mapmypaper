
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

/**
 * Extract images from a PDF file
 * @param pdfData Base64 string of PDF data
 * @returns Promise resolving to array of image data URLs
 */
export async function extractImagesFromPdf(pdfData: string): Promise<string[]> {
  try {
    console.log("Starting PDF image extraction");
    
    // Convert base64 to array buffer
    const binaryString = window.atob(pdfData.replace(/^data:application\/pdf;base64,/, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    const imagesList: string[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const operatorList = await page.getOperatorList();
      
      // Find image objects
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
            operatorList.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
          
          const imgArgs = operatorList.argsArray[i];
          if (!imgArgs) continue;
          
          const imgName = imgArgs[0]; // Get image object name
          if (!imgName) continue;
          
          try {
            // Get image object data
            const imgData = await extractImageDataFromPage(page, imgName);
            if (imgData) {
              imagesList.push(imgData);
              console.log(`Extracted image from page ${pageNum}`);
            }
          } catch (err) {
            console.error(`Error extracting image from page ${pageNum}:`, err);
          }
        }
      }
    }
    
    console.log(`Total images extracted: ${imagesList.length}`);
    return imagesList;
  } catch (error) {
    console.error("Error extracting images from PDF:", error);
    return [];
  }
}

/**
 * Extract image data from a specific PDF page
 * @param page PDF page object
 * @param imgName Image object name
 * @returns Promise resolving to image data URL
 */
async function extractImageDataFromPage(page: PDFPageProxy, imgName: string): Promise<string> {
  try {
    // Get the image objects from the page
    const objs = await page.objs.all;
    const imgObj = objs[imgName];
    
    if (!imgObj || !imgObj.data) {
      return '';
    }
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Set canvas dimensions to match image
    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    
    // Create ImageData object
    const imageData = ctx.createImageData(imgObj.width, imgObj.height);
    
    // Copy image data to ImageData object
    const data = imageData.data;
    const imgData = imgObj.data;
    
    for (let i = 0, j = 0; i < imgData.length; i++, j += 4) {
      data[j] = imgData[i];     // R
      data[j + 1] = imgData[i]; // G 
      data[j + 2] = imgData[i]; // B
      data[j + 3] = 255;        // A
    }
    
    // Put image data on canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error extracting image data from page:", error);
    return '';
  }
}

/**
 * Alternative approach to extract images using a simpler method
 * @param pdfData Base64 string of PDF data
 * @returns Promise resolving to array of image data URLs
 */
export async function extractImagesSimple(pdfData: string): Promise<string[]> {
  try {
    // Convert base64 to array buffer
    const binaryString = window.atob(pdfData.replace(/^data:application\/pdf;base64,/, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
    const pdf = await loadingTask.promise;
    
    const images: string[] = [];
    
    // Process each page to render as image
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create canvas for this page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Get image data URL from canvas
      const imageData = canvas.toDataURL('image/png');
      images.push(imageData);
    }
    
    return images;
  } catch (error) {
    console.error("Error in simple image extraction:", error);
    return [];
  }
}
