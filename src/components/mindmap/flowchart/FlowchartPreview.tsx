
import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
}

const FlowchartPreview = ({ code, error, isGenerating }: FlowchartPreviewProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [renderError, setRenderError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<number | null>(null);
  const svgIdRef = useRef<string>(`flowchart-${Date.now()}`);

  // Cleanup function to prevent memory leaks
  const cleanupPreviousRender = useCallback(() => {
    // Clear any pending timeouts
    if (renderTimeoutRef.current !== null) {
      window.clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
    
    // Clear the preview area to prevent stacking multiple diagrams
    if (previewRef.current) {
      previewRef.current.innerHTML = "";
    }
    
    // Reset any error state
    setRenderError(null);
  }, []);

  // Render flowchart when code changes
  useEffect(() => {
    // Clean up previous render first
    cleanupPreviousRender();
    
    // Add a small timeout to ensure DOM is ready
    renderTimeoutRef.current = window.setTimeout(() => {
      renderFlowchart();
    }, 100); // Increased timeout for more stability
    
    return () => {
      cleanupPreviousRender();
    };
  }, [code, cleanupPreviousRender]);

  // Ensure complete cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPreviousRender();
      
      // Find and remove any orphaned SVG elements that might have been created by mermaid
      try {
        const svgElements = document.querySelectorAll(`svg[id^="flowchart-"]`);
        svgElements.forEach(svg => {
          try {
            if (svg.parentNode) {
              svg.parentNode.removeChild(svg);
            }
          } catch (removeError) {
            console.error("Error removing SVG element:", removeError);
          }
        });
      } catch (err) {
        console.error("Error cleaning up SVG elements:", err);
      }
    };
  }, [cleanupPreviousRender]);

  const renderFlowchart = async () => {
    if (!previewRef.current) return;

    try {
      // Clear the preview area
      previewRef.current.innerHTML = "";
      
      // Ensure any error state is reset
      setRenderError(null);

      // Create a unique ID for the diagram
      const id = `flowchart-${Date.now()}`;
      svgIdRef.current = id;
      
      // Initialize mermaid configuration for this render
      await mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
        },
      });
      
      // Parse the flowchart to verify syntax before rendering
      await mermaid.parse(code);
      
      // If parse succeeds, render the flowchart
      const { svg } = await mermaid.render(id, code);
      
      // Only update DOM if the component is still mounted
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
      }
    } catch (err) {
      console.error("Failed to render flowchart:", err);
      setRenderError(err instanceof Error ? err.message : "Unknown rendering error");
      
      // Display error message in preview area
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="text-red-500 p-4">
          <h3 class="font-bold">Rendering Error</h3>
          <p>${err instanceof Error ? err.message : "Unknown error"}</p>
        </div>`;
      }
    }
  };

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomIn}
            className="p-1 h-8 w-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomOut}
            className="p-1 h-8 w-8"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetView}
            className="p-1 h-8"
            title="Reset View"
          >
            <Move className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      <div 
        className="border rounded-md p-4 flex-1 overflow-hidden bg-white relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={contentRef}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Loading indicator */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Error message */}
        {(error || renderError) && !isGenerating && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-md p-3 z-10">
            <p className="text-red-600 text-sm">
              {error || renderError}
            </p>
          </div>
        )}
        
        {/* The flowchart container */}
        <div 
          ref={previewRef} 
          className="absolute" 
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
        />
      </div>
    </div>
  );
};

export default FlowchartPreview;
