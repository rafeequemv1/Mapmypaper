import { MindElixirInstance } from "mind-elixir";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Exports the mind map as SVG and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportSvg = (instance: MindElixirInstance, fileName: string = 'mindmap'): void => {
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
export const exportPng = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
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
 * Exports the mind map as PDF and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportPdf = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    // Get the mind map container element
    const container = instance.container;
    if (!container) throw new Error("Mind map container not found");

    // Use html2canvas to capture the mind map as an image
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error exporting as PDF:", error);
    throw error;
  }
};

/**
 * Exports the mind map as HTML (Markmap) and triggers download
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const exportMarkmap = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    // Get the mind map data
    const data = instance.getData();
    
    // Convert to Markmap compatible format
    const markmapData = convertToMarkdownFormat(data);
    
    // Create HTML template with embedded Markmap
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    body { margin: 0; }
    #markmap { width: 100vw; height: 100vh; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/d3@6"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-view@0.2.7"></script>
</head>
<body>
  <svg id="markmap"></svg>
  <script>
    const data = ${JSON.stringify(markmapData)};
    const { Markmap } = window.markmap;
    const svgEl = document.getElementById('markmap');
    const mm = Markmap.create(svgEl, undefined, data);
  </script>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting as HTML:", error);
    throw error;
  }
};

/**
 * Converts Mind Elixir data format to Markmap compatible format
 */
function convertToMarkdownFormat(data: any): any {
  // Helper function to convert a node and its children
  function convertNode(node: any): any {
    const result: any = {
      content: node.topic || 'Untitled',
    };

    if (node.children && node.children.length > 0) {
      result.children = node.children.map(convertNode);
    }

    return result;
  }

  // Start conversion from the root node
  return convertNode(data.nodeData);
}

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

// Keep the following functions for backward compatibility
export const exportMapToSVG = exportSvg;
export const exportMapToPNG = exportPng;
export const downloadMindMapAsPNG = exportPng;
export const downloadMindMapAsSVG = exportSvg;

/**
 * Downloads an HTML element as PNG image using html2canvas
 * @param element Reference to the HTML element to download
 * @param fileName Name of the file without extension
 */
export const downloadElementAsPNG = async (element: HTMLElement, fileName: string = 'image'): Promise<void> => {
  try {
    // Use html2canvas directly since we've already imported it
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
