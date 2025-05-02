
import { MindElixirInstance } from "mind-elixir";

/**
 * Exports the mind map as SVG and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportMapToSVG = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
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
 * Exports the mind map as PNG and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportMapToPNG = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
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
 * Exports the mind map as JSON and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportMapToJSON = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
  try {
    const data = instance.getData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting as JSON:", error);
    throw error;
  }
};

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
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting element as PNG:", error);
    throw error;
  }
};
