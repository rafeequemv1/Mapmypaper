
import { MindElixirInstance } from "mind-elixir";

/**
 * Downloads the mind map as PNG image
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsPNG = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    const blob = await instance.exportPng(false); // Don't disable foreignObject
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
    // Get custom CSS to ensure proper styling
    const customCSS = `
      .mind-elixir-topic {
        font-family: 'Segoe UI', system-ui, sans-serif;
        line-height: 1.5;
      }
    `;
    
    // Use a single call to export the SVG
    const blob = instance.exportSvg(false, customCSS); // Don't disable foreignObject, include CSS
    if (blob) {
      // Create and trigger download
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
 * Custom zoom functions for the mind map
 * These are not natively available in MindElixir but we implement them ourselves
 */
export const customZoomIn = (instance: MindElixirInstance): void => {
  try {
    // Mind Elixir doesn't have built-in zoomIn but has scale method
    // Get the current scale and increase by 0.1
    const currentScale = instance.scale || 1;
    instance.scale(Math.min(currentScale + 0.1, 2)); // Limit max zoom to 2x
  } catch (error) {
    console.error("Error zooming in:", error);
  }
};

/**
 * Custom zoom out function for the mind map
 */
export const customZoomOut = (instance: MindElixirInstance): void => {
  try {
    // Mind Elixir doesn't have built-in zoomOut but has scale method
    // Get the current scale and decrease by 0.1
    const currentScale = instance.scale || 1;
    instance.scale(Math.max(currentScale - 0.1, 0.5)); // Limit min zoom to 0.5x
  } catch (error) {
    console.error("Error zooming out:", error);
  }
};
