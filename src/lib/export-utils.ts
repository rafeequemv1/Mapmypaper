
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

/**
 * Converts a Mind Elixir mind map structure to Mermaid mindmap syntax
 * @param instance Mind Elixir instance
 * @returns Mermaid mindmap syntax string
 */
export const convertMindMapToMermaidSyntax = (instance: MindElixirInstance): string => {
  const data = instance.exportData();
  const rootTopic = data.nodeData.topic;
  
  let mermaidCode = `mindmap\n`;
  mermaidCode += `  root((${rootTopic}))\n`;
  
  // Recursive function to process nodes
  const processNode = (node: any, parentId: string, depth: number = 1) => {
    const indent = "  ".repeat(depth + 1);
    
    if (!node.children) return;
    
    node.children.forEach((child: any, index: number) => {
      const nodeId = `${parentId}_${index}`;
      const topic = child.topic.replace(/[[\]()]/g, ''); // Remove brackets and parentheses
      
      // Choose node shape based on depth
      let nodeShape = '';
      if (depth === 1) {
        nodeShape = `["${topic}"]`; // First level: square bracket
      } else if (depth === 2) {
        nodeShape = `("${topic}")`; // Second level: parentheses
      } else if (depth === 3) {
        nodeShape = `{{"${topic}"}}`; // Third level: double curly braces
      } else {
        nodeShape = `>"${topic}"]`; // Other levels: cloud-like
      }
      
      mermaidCode += `${indent}${parentId} --> ${nodeId}${nodeShape}\n`;
      
      // Process children recursively
      if (child.children && child.children.length > 0) {
        processNode(child, nodeId, depth + 1);
      }
    });
  };
  
  // Start processing from root
  processNode(data.nodeData, 'root');
  
  return mermaidCode;
};

/**
 * Downloads a Mind Elixir mind map as a Mermaid diagram syntax file
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsMermaid = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
  try {
    const mermaidSyntax = convertMindMapToMermaidSyntax(instance);
    
    // Create a blob with the Mermaid syntax
    const blob = new Blob([mermaidSyntax], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting as Mermaid:", error);
    throw error;
  }
};
