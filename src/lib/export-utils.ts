import { MindElixirInstance } from "mind-elixir";
import html2canvas from "html2canvas";

/**
 * Get SVG data from a mind map instance
 * @param mindMap 
 * @returns SVG data as string
 */
export const getSvg = (mindMap: MindElixirInstance): string => {
  // Use a safeguard approach to handle mind-elixir's unstable API
  // First try the built-in export function if available
  if (typeof mindMap.exportSvg === 'function') {
    const svgData = mindMap.exportSvg();
    // Make sure we're returning a string, not a Blob
    if (typeof svgData === 'string') {
      return svgData;
    } else if (svgData instanceof Blob) {
      // We can't directly serialize a Blob, so we'll need to use the container's SVG instead
      return getSvgFromContainer(mindMap);
    } else if (svgData && typeof svgData === 'object' && 'nodeType' in svgData) {
      // If it's a DOM node, we can serialize it
      return new XMLSerializer().serializeToString(svgData as Node);
    } else {
      // Fallback to container method if type is unknown
      return getSvgFromContainer(mindMap);
    }
  }
  
  // Fallback: Get the SVG from container
  return getSvgFromContainer(mindMap);
};

/**
 * Extract SVG from the mind map container
 */
const getSvgFromContainer = (mindMap: MindElixirInstance): string => {
  const container = mindMap.container as HTMLElement;
  const svgElement = container.querySelector('svg');
  
  if (!svgElement) {
    throw new Error('SVG element not found in mind map');
  }
  
  // Clone the SVG to avoid modifying the original
  const svgClone = svgElement.cloneNode(true) as SVGElement;
  
  // Add XML namespace
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Return the SVG as string
  return new XMLSerializer().serializeToString(svgClone);
};

/**
 * Get image data URL from a mind map instance
 * @param mindMap 
 * @returns Promise resolving to a data URL
 */
export const getImage = async (mindMap: MindElixirInstance): Promise<string> => {
  const container = mindMap.container as HTMLElement;
  
  // Use html2canvas to capture the mindmap as an image
  const canvas = await html2canvas(container, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher resolution
    logging: false,
    useCORS: true,
    allowTaint: true,
  });
  
  // Return as data URL
  return canvas.toDataURL('image/png');
};

/**
 * Get JSON data from a mind map instance
 * @param mindMap 
 * @returns JSON data as object
 */
export const getJson = (mindMap: MindElixirInstance): any => {
  // Use the mind-elixir getData method
  return mindMap.getData();
};
