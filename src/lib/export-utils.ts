import { MindElixirInstance } from "mind-elixir";
import { downloadBlob } from "@/utils/downloadUtils";

/**
 * Downloads the mind map as PNG image
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsPNG = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    // The exportPng method returns an HTMLCanvasElement, not a promise
    const canvas = instance.exportPng(true); // Use 'true' for high quality
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
    
    downloadBlob(blob, `${fileName}.png`);
  } catch (error) {
    console.error("Error exporting as PNG:", error);
    throw error;
  }
};

/**
 * Downloads the mind map as SVG image
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsSVG = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
  try {
    const svgContent = instance.exportSvg();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${fileName}.svg`);
  } catch (error) {
    console.error("Error exporting as SVG:", error);
    throw error;
  }
};

/**
 * Downloads an HTML element as PNG image using html2canvas
 * @param element Reference to the HTML element to download
 * @param fileName Name of the file without extension
 * @returns Promise that resolves with the data URL of the captured image
 */
export const downloadElementAsPNG = async (element: HTMLElement, fileName: string = 'image'): Promise<string> => {
  try {
    // Signal that capture process is starting before doing any work
    // Added inPdf: false to indicate this is a global capture, not from PDF viewer
    window.dispatchEvent(new CustomEvent('captureInProgress', { detail: { inProgress: true, inPdf: false } }));
    
    // Dynamically import html2canvas to ensure it's available
    const html2canvas = (await import('html2canvas')).default;
    
    // Check if we're on a custom domain or lovable.app
    const isCustomDomain = window.location.hostname !== 'localhost' && !window.location.hostname.includes('lovable');
    
    // Create HTML2Canvas options with CORS handling for custom domains
    const options = {
      scale: 2, // Higher resolution
      useCORS: true, // Always try to use CORS
      allowTaint: true, // Allow tainted canvas if CORS fails
      backgroundColor: '#ffffff',
      logging: isCustomDomain, // Enable logging on custom domains to help with debugging
      foreignObjectRendering: false // Disable foreignObject for better cross-domain compatibility
    };
    
    if (isCustomDomain) {
      console.log('Using CORS-friendly options for custom domain:', window.location.hostname);
    }
    
    // Start the capture process - this might take a while
    console.log('Starting HTML2Canvas capture...');
    const canvas = await html2canvas(element, options);
    console.log('HTML2Canvas capture completed');
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link using the utility function
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(blob, `${fileName}.png`);
    
    // Wait a brief moment before signaling completion to allow UI to update properly
    // This small delay helps ensure the rectangle stays visible long enough for feedback
    setTimeout(() => {
      // Signal that capture is complete with success flag
      window.dispatchEvent(new CustomEvent('captureInProgress', { 
        detail: { inProgress: false, success: true, inPdf: false } 
      }));
    }, 500);
    
    // Return the data URL for other uses
    return dataUrl;
  } catch (error) {
    console.error("Error exporting element as PNG:", error);
    
    // Signal that capture failed but keep the UI element visible a bit longer
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('captureInProgress', { 
        detail: { inProgress: false, error: true, inPdf: false } 
      }));
      
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        console.error("Error stack:", error.stack);
        
        // Dispatch an event with additional details for the UI
        window.dispatchEvent(new CustomEvent('captureError', { 
          detail: { 
            message: `Screenshot failed: ${error.message}. Check console for details.`,
            error: error 
          } 
        }));
      }
    }, 1000);
    
    throw error;
  }
};
