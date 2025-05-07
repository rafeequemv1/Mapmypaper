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
      useCORS: true,
      foreignObjectRendering: false // Disable foreignObject rendering which can cause issues across domains
    };
    
    // Add CORS proxy support if needed
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('lovable')) {
      console.log('Using CORS-friendly capture method for published domain');
    }
    
    const canvas = await html2canvas(element, captureOptions);
    
    // Convert the canvas to a data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing element area:', error);
    
    // Log more detailed information about the error for debugging
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error('Error stack:', error.stack);
    }
    
    // Report user-friendly error
    window.dispatchEvent(new CustomEvent('captureError', { 
      detail: { message: 'Failed to capture screenshot. This may be due to security restrictions on your domain.' } 
    }));
    
    return null;
  }
}

/**
 * Applies or removes text selection prevention styles to the document
 * 
 * @param enable - Whether to enable or disable text selection
 */
export function toggleTextSelection(enable: boolean) {
  const rootElement = document.documentElement;
  
  if (enable) {
    // Enable text selection
    rootElement.style.removeProperty('user-select');
    rootElement.classList.remove('no-text-selection');
  } else {
    // Disable text selection
    rootElement.style.setProperty('user-select', 'none', 'important');
    rootElement.classList.add('no-text-selection');
  }

  // Also ensure we have the CSS class defined
  if (!enable && !document.getElementById('no-text-selection-style')) {
    const style = document.createElement('style');
    style.id = 'no-text-selection-style';
    style.innerHTML = `
      .no-text-selection * {
        user-select: none !important;
        pointer-events: auto !important;
      }
      .no-text-selection .react-pdf__Page__textContent {
        user-select: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
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
  
  // Create capture button tooltip
  const captureTooltip = document.createElement('div');
  captureTooltip.className = 'absolute bg-blue-600 text-white px-2 py-1 rounded text-sm z-50 cursor-pointer shadow-md hover:bg-blue-700 transition-colors duration-150';
  captureTooltip.style.display = 'none';
  captureTooltip.textContent = 'Capture';
  containerElement.appendChild(captureTooltip);
  
  // Selection state
  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let currentRect = { x: 0, y: 0, width: 0, height: 0 };
  let isCapturing = false;
  
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
    
    // Store current rect
    currentRect = { x: left, y: top, width, height };
    
    // Position the tooltip above the rectangle
    captureTooltip.style.left = `${left + width/2 - captureTooltip.offsetWidth/2}px`;
    captureTooltip.style.top = `${top - captureTooltip.offsetHeight - 5}px`;
    
    // Return the current rectangle dimensions
    return currentRect;
  };
  
  // Start selection
  const startSelection = (x: number, y: number) => {
    isSelecting = true;
    startX = x;
    startY = y;
    selectionRect.style.display = 'block';
    // Disable text selection when starting to draw
    toggleTextSelection(false);
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
      captureTooltip.style.display = 'none';
      // Re-enable text selection when canceling selection
      toggleTextSelection(true);
      return null;
    }
    
    // Show the capture tooltip
    captureTooltip.style.display = 'block';
    
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
    captureTooltip.style.display = 'none';
    isCapturing = false;
    // Re-enable text selection when canceling selection
    toggleTextSelection(true);
  };
  
  // Set capture loading state
  const setCapturing = (capturing: boolean) => {
    isCapturing = capturing;
    
    if (capturing) {
      // Show loading state
      captureTooltip.innerHTML = '<div class="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div> Capturing...';
      captureTooltip.classList.add('bg-blue-800');
      captureTooltip.classList.remove('hover:bg-blue-700');
      captureTooltip.style.cursor = 'default';
    } else {
      // Reset to normal state
      captureTooltip.textContent = 'Capture';
      captureTooltip.classList.remove('bg-blue-800');
      captureTooltip.classList.add('hover:bg-blue-700');
      captureTooltip.style.cursor = 'pointer';
      // Re-enable text selection when capture is done
      toggleTextSelection(true);
    }
  };
  
  // Add scroll listener to update rectangle position when scrolling
  const handleScroll = () => {
    if (selectionRect.style.display !== 'none') {
      updateRect(startX, startY);
    }
  };
  
  containerElement.addEventListener('scroll', handleScroll);
  
  // Set up click handler for the tooltip
  captureTooltip.addEventListener('click', () => {
    if (isCapturing) return; // Prevent multiple captures
    
    // Dispatch a custom event with the current rectangle
    const captureEvent = new CustomEvent('captureArea', {
      detail: { rect: currentRect }
    });
    
    containerElement.dispatchEvent(captureEvent);
    setCapturing(true);
  });
  
  // Add error handling for capture failures
  containerElement.addEventListener('captureError', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.message) {
      // Display error message
      captureTooltip.textContent = 'Capture failed';
      captureTooltip.classList.add('bg-red-600');
      
      // Reset after a delay
      setTimeout(() => {
        setCapturing(false);
        cancelSelection();
      }, 2000);
    }
  });
  
  // Capture complete handler - Keep the tooltip shown until explicitly told to hide
  const captureComplete = () => {
    // Change tooltip to show completion
    captureTooltip.textContent = 'Captured!';
    captureTooltip.classList.remove('bg-blue-800');
    captureTooltip.classList.add('bg-green-600');
    
    // After showing success, remove after delay
    setTimeout(() => {
      if (containerElement.contains(captureTooltip)) {
        captureTooltip.style.display = 'none';
      }
    }, 1500);
  };
  
  // Remove selection elements
  const destroy = () => {
    containerElement.removeEventListener('scroll', handleScroll);
    
    if (containerElement.contains(selectionRect)) {
      containerElement.removeChild(selectionRect);
    }
    if (containerElement.contains(captureTooltip)) {
      containerElement.removeChild(captureTooltip);
    }
    // Re-enable text selection when destroying
    toggleTextSelection(true);
  };
  
  // Return control methods
  return {
    startSelection,
    moveSelection,
    endSelection,
    cancelSelection,
    setCapturing,
    captureComplete,
    destroy,
    isSelecting: () => isSelecting,
    isCapturing: () => isCapturing
  };
}
