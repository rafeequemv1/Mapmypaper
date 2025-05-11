
import { useState, useRef, useEffect } from 'react';
import { toggleTextSelection } from "@/utils/captureUtils";

export function usePdfSelection(pdfContainerRef: React.RefObject<HTMLDivElement>, highlightByDefault: boolean = false) {
  const [selectedText, setSelectedText] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false);
  const tooltipTextRef = useRef<string>("");
  const selectionTooltipRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  
  // Store the viewport ref when the scroll area is mounted
  useEffect(() => {
    if (pdfContainerRef.current) {
      viewportRef.current = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
    }
  }, [pdfContainerRef.current]);
  
  // Effect for text selection to respect highlightByDefault prop
  useEffect(() => {
    let selectionTimeout: number | null = null;
    
    // Enable text selection by default if highlightByDefault is true
    if (highlightByDefault) {
      toggleTextSelection(true);
    }
    
    const handleTextSelection = () => {
      const selection = window.getSelection();
      
      // Clear any existing timeout
      if (selectionTimeout) {
        window.clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }
      
      // Only proceed if we have a valid selection
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text) {
          setSelectedText(text);
          tooltipTextRef.current = text;
          
          // Get the precise position for tooltip
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          if (pdfContainerRef.current && viewportRef.current) {
            // Calculate the position relative to the PDF container's scroll position
            const containerRect = pdfContainerRef.current.getBoundingClientRect();
            const scrollTop = viewportRef.current.scrollTop;
            
            const x = rect.left + (rect.width / 2) - containerRect.left;
            // Key change: Y position is relative to the page, not the viewport
            const y = rect.top + scrollTop - containerRect.top;
            
            setTooltipPosition({ x, y });
            
            // Show tooltip with slight delay to ensure position is updated
            selectionTimeout = window.setTimeout(() => {
              setShowSelectionTooltip(true);
            }, 50);
          }
        }
      } else if (!selectionTooltipRef.current?.contains(document.activeElement)) {
        // Hide tooltip if clicked elsewhere and not on tooltip itself
        // But don't hide if user clicked the tooltip button
        if (document.activeElement !== selectionTooltipRef.current) {
          selectionTimeout = window.setTimeout(() => {
            if (!document.getSelection()?.toString()) {
              setShowSelectionTooltip(false);
            }
          }, 100);
        }
      }
    };
    
    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      if (selectionTimeout) window.clearTimeout(selectionTimeout);
    };
  }, [highlightByDefault, pdfContainerRef]);
  
  return {
    selectedText,
    tooltipPosition,
    showSelectionTooltip,
    setShowSelectionTooltip,
    tooltipTextRef,
    selectionTooltipRef
  };
}

export default usePdfSelection;
