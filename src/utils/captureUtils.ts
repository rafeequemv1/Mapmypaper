
/**
 * Utility functions for capturing screenshot areas of the PDF
 */

/**
 * Captures a specific region of the PDF as an image
 * 
 * @param element - The element to capture
 * @param rect - The rectangle coordinates representing the area to capture
 * @returns A Promise that resolves with the image data URL
 */
export async function captureElementArea(
  element: HTMLElement,
  rect: { x: number; y: number; width: number; height: number }
): Promise<string | null> {
  try {
    // Import html2canvas dynamically to avoid bundling issues
    const html2canvas = (await import('html2canvas')).default;
    
    // Calculate the position relative to the element
    const elementRect = element.getBoundingClientRect();
    
    // Ensure the capture area is within the element
    const captureOptions = {
      x: Math.max(0, rect.x),
      y: Math.max(0, rect.y),
      width: Math.min(rect.width, elementRect.width - rect.x),
      height: Math.min(rect.height, elementRect.height - rect.y),
      backgroundColor: null,
      scale: window.devicePixelRatio, // Use device pixel ratio for better quality
      logging: false,
      allowTaint: true,
      useCORS: true
    };
    
    const canvas = await html2canvas(element, captureOptions);
    
    // Convert the canvas to a data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing element area:', error);
    return null;
  }
}

/**
 * Draws a selection rectangle on the screen
 * 
 * @param containerElement - The container element where the rectangle will be drawn
 * @returns Object with methods to control the selection rectangle
 */
export function createSelectionRect(containerElement: HTMLElement) {
  // Create selection rectangle element
  const selectionRect = document.createElement('div');
  selectionRect.className = 'absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none z-50';
  selectionRect.style.display = 'none';
  containerElement.appendChild(selectionRect);
  
  // Selection state
  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  
  // Update rectangle position and dimensions
  const updateRect = (endX: number, endY: number) => {
    const containerRect = containerElement.getBoundingClientRect();
    const scrollTop = containerElement.scrollTop;
    
    // Calculate actual positions relative to the container
    const relStartX = startX - containerRect.left;
    const relStartY = startY - containerRect.top + scrollTop;
    const relEndX = endX - containerRect.left;
    const relEndY = endY - containerRect.top + scrollTop;
    
    // Calculate rectangle dimensions
    const left = Math.min(relStartX, relEndX);
    const top = Math.min(relStartY, relEndY);
    const width = Math.abs(relEndX - relStartX);
    const height = Math.abs(relEndY - relStartY);
    
    // Update rectangle style
    selectionRect.style.left = `${left}px`;
    selectionRect.style.top = `${top}px`;
    selectionRect.style.width = `${width}px`;
    selectionRect.style.height = `${height}px`;
    
    // Return the current rectangle dimensions
    return { x: left, y: top, width, height };
  };
  
  // Start selection
  const startSelection = (x: number, y: number) => {
    isSelecting = true;
    startX = x;
    startY = y;
    selectionRect.style.display = 'block';
    updateRect(x, y);
  };
  
  // End selection
  const endSelection = (x: number, y: number) => {
    if (!isSelecting) return null;
    
    isSelecting = false;
    const rect = updateRect(x, y);
    
    // Hide rectangle if dimensions are too small (likely an accidental click)
    if (rect.width < 10 || rect.height < 10) {
      selectionRect.style.display = 'none';
      return null;
    }
    
    return rect;
  };
  
  // Move selection
  const moveSelection = (x: number, y: number) => {
    if (!isSelecting) return;
    updateRect(x, y);
  };
  
  // Cancel selection
  const cancelSelection = () => {
    isSelecting = false;
    selectionRect.style.display = 'none';
  };
  
  // Remove selection elements
  const destroy = () => {
    if (containerElement.contains(selectionRect)) {
      containerElement.removeChild(selectionRect);
    }
  };
  
  // Return control methods
  return {
    startSelection,
    moveSelection,
    endSelection,
    cancelSelection,
    destroy,
    isSelecting: () => isSelecting
  };
}
