
import { MindElixirInstance } from "mind-elixir";

/**
 * Downloads the mind map as PNG image
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsPNG = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    // Use 'any' type to bypass TypeScript restrictions since the actual implementation might differ
    const mindInstance = instance as any;
    if (typeof mindInstance.exportPng === 'function') {
      const blob = await mindInstance.exportPng(false); // Don't disable foreignObject
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
    } else {
      console.error("exportPng method not available on the mind map instance");
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
    // Use 'any' type to bypass TypeScript restrictions
    const mindInstance = instance as any;
    // Get custom CSS to ensure proper styling
    const customCSS = `
      .mind-elixir-topic {
        font-family: 'Segoe UI', system-ui, sans-serif;
        line-height: 1.5;
      }
    `;
    
    // Check if the exportSvg method is available
    if (typeof mindInstance.exportSvg === 'function') {
      const blob = mindInstance.exportSvg(false, customCSS); // Don't disable foreignObject, include CSS
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
    } else {
      console.error("exportSvg method not available on the mind map instance");
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
    // Use 'any' type to bypass TypeScript restrictions
    const mindInstance = instance as any;
    if (typeof mindInstance.scale === 'function') {
      // If scale is a function, call it with a new scale value
      const currentScale = typeof mindInstance.scaleVal === 'number' ? mindInstance.scaleVal : 1;
      const newScale = Math.min(currentScale + 0.1, 2); // Limit max zoom to 2x
      mindInstance.scale(newScale);
    } else {
      console.error("Scale method not available on the mind map instance");
    }
  } catch (error) {
    console.error("Error zooming in:", error);
  }
};

/**
 * Custom zoom out function for the mind map
 */
export const customZoomOut = (instance: MindElixirInstance): void => {
  try {
    // Use 'any' type to bypass TypeScript restrictions
    const mindInstance = instance as any;
    if (typeof mindInstance.scale === 'function') {
      // If scale is a function, call it with a new scale value
      const currentScale = typeof mindInstance.scaleVal === 'number' ? mindInstance.scaleVal : 1;
      const newScale = Math.max(currentScale - 0.1, 0.5); // Limit min zoom to 0.5x
      mindInstance.scale(newScale);
    } else {
      console.error("Scale method not available on the mind map instance");
    }
  } catch (error) {
    console.error("Error zooming out:", error);
  }
};
