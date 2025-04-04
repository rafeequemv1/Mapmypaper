
import { MindElixirInstance } from "mind-elixir";
import jsPDF from "jspdf";

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
 * Downloads the mind map as PDF document
 * @param instance Mind Elixir instance
 * @param fileName Name of the file without extension
 */
export const downloadMindMapAsPDF = async (instance: MindElixirInstance, fileName: string = 'mindmap'): Promise<void> => {
  try {
    // Get the PNG blob from Mind Elixir
    const pngBlob = await instance.exportPng();
    if (!pngBlob) {
      throw new Error("Failed to generate PNG for PDF export");
    }
    
    // Convert blob to data URL
    const reader = new FileReader();
    reader.readAsDataURL(pngBlob);
    
    reader.onloadend = function() {
      const base64data = reader.result as string;
      
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: 'landscape', // Most mindmaps are wider than they are tall
        unit: 'mm',
        format: 'a4'
      });
      
      // Get dimensions to fit the image properly
      const imgProps = pdf.getImageProperties(base64data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate proper scaling to fit the image on the page with margins
      const margin = 10; // 10mm margin
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Calculate the scaling ratio while maintaining aspect ratio
      const aspectRatio = imgProps.width / imgProps.height;
      let width = availableWidth;
      let height = width / aspectRatio;
      
      // Check if height exceeds available space
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }
      
      // Add the image to the PDF centered on the page
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;
      
      pdf.addImage(base64data, 'PNG', x, y, width, height);
      
      // Add title and metadata
      pdf.setFontSize(10);
      pdf.text(`MapMyPaper - Mind Map`, pdfWidth / 2, 10, { align: 'center' });
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      
      // Save the PDF
      pdf.save(`${fileName}.pdf`);
    };
  } catch (error) {
    console.error("Error exporting as PDF:", error);
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
