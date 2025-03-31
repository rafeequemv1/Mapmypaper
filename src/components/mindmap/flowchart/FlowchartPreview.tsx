
import { useEffect, useRef, useState, forwardRef, ForwardedRef } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
}

const FlowchartPreview = forwardRef((
  { code, error, isGenerating }: FlowchartPreviewProps, 
  ref: ForwardedRef<HTMLDivElement>
) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLDivElement>(null);
  
  // Use the forwarded ref or fall back to the internal ref
  const previewRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalRef;

  // Render flowchart when code changes
  useEffect(() => {
    if (previewRef.current) {
      renderFlowchart();
    }
  }, [code]);

  const renderFlowchart = async () => {
    if (!previewRef.current) return;

    try {
      // Clear the preview area
      previewRef.current.innerHTML = "";

      // Create a unique ID for the diagram
      const id = `flowchart-${Date.now()}`;
      
      // Parse the flowchart to verify syntax before rendering
      await mermaid.parse(code);
      
      // If parse succeeds, render the flowchart
      const { svg } = await mermaid.render(id, code);
      previewRef.current.innerHTML = svg;
    } catch (err) {
      console.error("Failed to render flowchart:", err);
      
      // Display error message in preview area
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="text-red-500 p-4">
          <h3 class="font-bold">Rendering Error</h3>
          <p>${err instanceof Error ? err.message : "Unknown error"}</p>
        </div>`;
      }
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

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
        <div 
          ref={previewRef} 
          className="absolute" 
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
        >
          {isGenerating ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

FlowchartPreview.displayName = "FlowchartPreview";

export default FlowchartPreview;
