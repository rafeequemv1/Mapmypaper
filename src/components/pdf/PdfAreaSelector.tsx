
import { useState, useRef, useEffect, MouseEvent, CSSProperties } from "react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface PdfAreaSelectorProps {
  onExplainSelection: (imageDataUrl: string) => void;
}

export const PdfAreaSelector = ({ onExplainSelection }: PdfAreaSelectorProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const selectorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Calculate selection box dimensions
  const selectionStyle: CSSProperties = {
    position: 'absolute',
    border: '2px solid #3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    pointerEvents: 'none',
    zIndex: 40,
    top: Math.min(selectionStart.y, selectionEnd.y),
    left: Math.min(selectionStart.x, selectionEnd.x),
    width: Math.abs(selectionEnd.x - selectionStart.x),
    height: Math.abs(selectionEnd.y - selectionStart.y),
    display: isSelecting ? 'block' : 'none'
  };

  // Calculate tooltip position
  const tooltipStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    top: tooltipPosition.y,
    left: tooltipPosition.x,
    display: showTooltip ? 'block' : 'none'
  };

  // Handle mouse down to start selection
  const handleMouseDown = (e: MouseEvent) => {
    if (!selectorRef.current) return;
    
    // Get container position
    const rect = selectorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setIsSelecting(true);
    setShowTooltip(false);
  };

  // Handle mouse move during selection
  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting || !selectorRef.current) return;
    
    // Get container position
    const rect = selectorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectionEnd({ x, y });
  };

  // Handle mouse up to end selection
  const handleMouseUp = async (e: MouseEvent) => {
    if (!isSelecting || !selectorRef.current) return;
    
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Only process if selection is large enough
    if (width > 10 && height > 10) {
      // Position tooltip near end of selection
      setTooltipPosition({
        x: selectionEnd.x + 10,
        y: selectionEnd.y + 10
      });
      setShowTooltip(true);
    } else {
      setIsSelecting(false);
    }
  };

  // Capture screenshot of the selected area
  const captureScreenshot = async () => {
    try {
      if (!selectorRef.current) return;
      
      // Get PDF container - it's the parent of our selector overlay
      const pdfContainer = selectorRef.current.closest('[data-pdf-viewer]');
      if (!pdfContainer) {
        throw new Error("Could not locate PDF container");
      }
      
      // Calculate selection coordinates
      const left = Math.min(selectionStart.x, selectionEnd.x);
      const top = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      
      // Capture the entire container
      const canvas = await html2canvas(pdfContainer as HTMLElement, {
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Create a new canvas with only the selected area
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      const ctx = croppedCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Draw only the selected portion
      ctx.drawImage(
        canvas, 
        left, 
        top, 
        width, 
        height, 
        0, 
        0, 
        width, 
        height
      );
      
      // Get data URL and send to parent
      const dataUrl = croppedCanvas.toDataURL('image/png');
      onExplainSelection(dataUrl);
      
      // Reset selection state
      setIsSelecting(false);
      setShowTooltip(false);
      
      toast({
        title: 'Screenshot captured',
        description: 'Image has been sent to chat for explanation',
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: 'Screenshot failed',
        description: 'Could not capture the selected area',
        variant: 'destructive'
      });
      setIsSelecting(false);
      setShowTooltip(false);
    }
  };

  // Handle document click to close tooltip when clicking elsewhere
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (showTooltip && !e.target) {
        setShowTooltip(false);
        setIsSelecting(false);
      }
    };

    document.addEventListener('click', handleDocumentClick as any);
    return () => {
      document.removeEventListener('click', handleDocumentClick as any);
    };
  }, [showTooltip]);

  // Handle escape key to cancel selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isSelecting || showTooltip)) {
        setIsSelecting(false);
        setShowTooltip(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelecting, showTooltip]);

  return (
    <div 
      ref={selectorRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection box */}
      <div style={selectionStyle} />
      
      {/* Tooltip */}
      <div 
        style={tooltipStyle} 
        className="bg-white shadow-lg rounded-lg p-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          captureScreenshot();
        }}
      >
        <button className="text-blue-600 font-medium flex items-center gap-1 text-sm">
          <span className="i-lucide-image h-4 w-4"></span>
          Explain Selection
        </button>
      </div>
    </div>
  );
};

export default PdfAreaSelector;
