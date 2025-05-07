
import { MindElixirInstance } from "mind-elixir";

/**
 * Downloads the mind map as PNG image
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsPNG = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    const blob = await instance.exportPng();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
    const blob = instance.exportSvg();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Error exporting as SVG:", error);
    throw error;
  }
};

/**
 * Downloads an HTML element as PNG image using html2canvas
 * @param element Reference to the HTML element to download
 * @param fileName Name of the file without extension
 */
export const downloadElementAsPNG = async (element: HTMLElement, fileName: string = 'image'): Promise<void> => {
  try {
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
    
    // Show a notification that capturing is in progress
    window.dispatchEvent(new CustomEvent('captureInProgress', { detail: { inProgress: true } }));
    
    const canvas = await html2canvas(element, options);
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Signal that capture is complete
    window.dispatchEvent(new CustomEvent('captureInProgress', { detail: { inProgress: false } }));
    return dataUrl;
  } catch (error) {
    console.error("Error exporting element as PNG:", error);
    
    // Signal that capture failed
    window.dispatchEvent(new CustomEvent('captureInProgress', { detail: { inProgress: false, error: true } }));
    
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
    
    throw error;
  }
};
