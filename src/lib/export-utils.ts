
import { MindElixirInstance } from "mind-elixir";

/**
 * Downloads the mind map as SVG image with optimal settings
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsSVG = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
  try {
    // Use custom styling to ensure proper rendering with emojis
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
        line-height: 1.5;
      }
      .mind-elixir-root {
        font-weight: bold;
        font-size: 20px;
      }
    `;
    
    // Cast instance to access the exportSvg method that takes parameters
    const extendedInstance = instance as unknown as {
      exportSvg: (noForeignObject?: boolean, injectCss?: string) => Blob;
    };
    
    // Export with foreignObject enabled for proper text wrapping and custom CSS
    const blob = extendedInstance.exportSvg(false, customStyles);
    
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
