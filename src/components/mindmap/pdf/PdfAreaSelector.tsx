
import React, { useRef, useEffect, useState } from "react";
import { fabric } from "fabric";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface PdfAreaSelectorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const PdfAreaSelector: React.FC<PdfAreaSelectorProps> = ({
  containerRef,
  isActive,
  onCapture,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<fabric.Rect | null>(null);
  const { toast } = useToast();

  // Initialize Fabric canvas when selection mode becomes active
  useEffect(() => {
    if (!isActive || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Set canvas dimensions to match container
    const canvas = canvasRef.current;
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    // Initialize fabric.js canvas with semi-transparent overlay
    const fabricInstance = new fabric.Canvas(canvas, {
      selection: false,
      preserveObjectStacking: true,
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    });
    
    setFabricCanvas(fabricInstance);
    
    // Clear any toast messages that might be showing from previous attempts
    toast({
      title: "Selection Mode",
      description: "Click and drag to select an area of the PDF",
    });
    
    // Clean up function
    return () => {
      if (fabricInstance) {
        fabricInstance.dispose();
        setSelectionRect(null);
        setShowTooltip(false);
      }
    };
  }, [isActive, containerRef]);

  // Handle window resize
  useEffect(() => {
    if (!fabricCanvas || !containerRef.current) return;
    
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current || !fabricCanvas) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      fabricCanvas.setDimensions({
        width: containerRect.width,
        height: containerRect.height
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas, containerRef]);

  // Set up drawing functionality
  useEffect(() => {
    if (!fabricCanvas) return;

    let startX = 0;
    let startY = 0;
    let isDrawing = false;
    
    fabricCanvas.on('mouse:down', (options) => {
      // Start drawing rectangle
      isDrawing = true;
      
      const pointer = fabricCanvas.getPointer(options.e);
      startX = pointer.x;
      startY = pointer.y;
      
      // Create rectangle
      const rect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'rgba(66, 135, 245, 0.2)',
        stroke: '#4287f5',
        strokeWidth: 2,
        strokeUniform: true,
        selectable: false
      });
      
      // Remove any existing rectangles to ensure only one at a time
      if (selectionRect) {
        fabricCanvas.remove(selectionRect);
      }
      
      fabricCanvas.add(rect);
      fabricCanvas.renderAll();
      setSelectionRect(rect);
      setShowTooltip(false); // Hide tooltip when starting a new selection
    });

    fabricCanvas.on('mouse:move', (options) => {
      if (!isDrawing || !selectionRect) return;
      
      const pointer = fabricCanvas.getPointer(options.e);
      
      // Calculate dimensions for rectangle (allows drawing from any direction)
      const left = Math.min(startX, pointer.x);
      const top = Math.min(startY, pointer.y);
      const width = Math.abs(pointer.x - startX);
      const height = Math.abs(pointer.y - startY);
      
      // Update rectangle
      selectionRect.set({
        left: left,
        top: top,
        width: width,
        height: height
      });
      
      fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', (options) => {
      isDrawing = false;
      
      if (!selectionRect) return;
      
      // Only show tooltip for meaningful selections
      if (selectionRect.width > 10 && selectionRect.height > 10) {
        const pointer = fabricCanvas.getPointer(options.e);
        setTooltipPosition({ x: pointer.x, y: pointer.y });
        setShowTooltip(true);
      } else {
        // Remove too small rectangles
        fabricCanvas.remove(selectionRect);
        setSelectionRect(null);
      }
    });
    
  }, [fabricCanvas, selectionRect]);

  const handleCaptureArea = async () => {
    if (!selectionRect || !containerRef.current) {
      toast({
        title: "Capture failed",
        description: "No valid area selected",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get the bounding box of the selection in canvas coordinates
      const rect = selectionRect.getBoundingRect();
      
      // Find the PDF page elements
      const pdfPages = containerRef.current.querySelectorAll('[data-page-number]');
      if (pdfPages.length === 0) {
        toast({
          title: "Capture failed",
          description: "Could not find PDF content",
          variant: "destructive"
        });
        return;
      }
      
      // Use html2canvas to capture the entire PDF container
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: window.devicePixelRatio
      });
      
      // Create a new canvas for the cropped area
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get 2D context");
      }
      
      // Set the dimensions of the cropped canvas
      croppedCanvas.width = rect.width;
      croppedCanvas.height = rect.height;
      
      // Draw the cropped area onto the new canvas
      ctx.drawImage(
        canvas, 
        rect.left, 
        rect.top, 
        rect.width, 
        rect.height, 
        0, 
        0, 
        rect.width, 
        rect.height
      );
      
      // Convert to data URL
      const imageData = croppedCanvas.toDataURL('image/png');
      
      // Pass the captured image up
      onCapture(imageData);
      
      // Reset the selection
      setShowTooltip(false);
      if (fabricCanvas) {
        fabricCanvas.remove(selectionRect);
      }
      setSelectionRect(null);
      
      toast({
        title: "Area captured",
        description: "The selected area has been sent to the chat"
      });
    } catch (error) {
      console.error('Error capturing area:', error);
      toast({
        title: "Capture failed",
        description: "An error occurred while capturing the area",
        variant: "destructive"
      });
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'all', cursor: 'crosshair' }}
      />
      
      {showTooltip && (
        <div
          className="absolute bg-white rounded-md shadow-md p-3 border border-gray-200 z-30"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            maxWidth: '250px'
          }}
        >
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium">Area selected</h4>
            <p className="text-xs text-muted-foreground">Send this area to chat for explanation?</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                onClick={() => {
                  if (fabricCanvas && selectionRect) {
                    fabricCanvas.remove(selectionRect);
                    setSelectionRect(null);
                  }
                  setShowTooltip(false);
                  onCancel();
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                onClick={handleCaptureArea}
              >
                Capture This Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfAreaSelector;
