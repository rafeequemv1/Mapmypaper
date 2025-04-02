
import { MindElixirInstance } from "mind-elixir";

/**
 * Downloads the mind map as SVG image with optimal settings
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsSVG = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
  try {
    // Use custom styling to ensure proper rendering
    const customStyles = `
      .mind-elixir-node {
        font-family: 'Segoe UI', system-ui, sans-serif;
      }
      .mind-elixir-topic {
        border-radius: 12px;
        padding: 10px 16px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        font-weight: normal;
        font-size: 16px;
      }
      .mind-elixir-root {
        font-weight: bold;
        font-size: 20px;
      }
    `;
    
    // Export with foreignObject enabled for proper text wrapping and custom CSS
    const blob = instance.exportSvg(false, customStyles);
    
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
 * Downloads the mind map as PNG image (kept for compatibility)
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
