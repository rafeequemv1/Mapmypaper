
import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme?: "default" | "forest" | "dark" | "neutral";
  previewRef: React.RefObject<HTMLDivElement>;
}

const FlowchartPreview = ({ 
  code, 
  error, 
  isGenerating, 
  theme = "forest",
  previewRef
}: FlowchartPreviewProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  // Render flowchart when code or theme changes
  useEffect(() => {
    if (code && previewRef.current) {
      renderFlowchart();
    }
    
    // Cleanup function to prevent DOM manipulation errors
    return () => {
      if (previewRef.current) {
        try {
          // Safely clean up the preview container
          while (previewRef.current.firstChild) {
            previewRef.current.removeChild(previewRef.current.firstChild);
          }
        } catch (error) {
          console.error("Failed to clean up preview container:", error);
        }
      }
    };
  }, [code, theme]);

  const renderFlowchart = async () => {
    if (!previewRef.current) return;

    try {
      // Safely clear the preview area before rendering a new chart
      while (previewRef.current.firstChild) {
        previewRef.current.removeChild(previewRef.current.firstChild);
      }

      // Create a unique ID for the diagram
      const id = `flowchart-${Date.now()}`;
      
      // Configure mermaid with enhanced styling and selected theme
      mermaid.initialize({
        theme: theme,
        startOnLoad: true,
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis',
          rankSpacing: 80,
          nodeSpacing: 50,
          padding: 15
        },
        themeVariables: {
          primaryColor: '#9b87f5',
          primaryTextColor: '#fff',
          primaryBorderColor: '#7E69AB',
          lineColor: '#6E59A5',
          secondaryColor: '#D6BCFA',
          tertiaryColor: '#f2fcf5'
        }
      });
      
      // Parse the flowchart to verify syntax before rendering
      await mermaid.parse(code);
      
      // If parse succeeds, render the flowchart
      const { svg } = await mermaid.render(id, code);
      
      // Make sure previewRef is still valid before updating the DOM
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
        
        // Post-process the SVG to add more colors to nodes if needed
        const nodeElements = previewRef.current.querySelectorAll("g.node");
        const colors = [
          "#8B5CF6", "#D946EF", "#F97316", "#0EA5E9", 
          "#10B981", "#EF4444", "#F59E0B", "#6366F1"
        ];
        
        let colorIndex = 0;
        nodeElements.forEach((node) => {
          const rect = node.querySelector("rect");
          if (rect) {
            rect.setAttribute("fill", colors[colorIndex % colors.length]);
            rect.setAttribute("stroke", "#4B5563");
            colorIndex++;
          }
        });

        // Make text more readable
        const textElements = previewRef.current.querySelectorAll("g.node text");
        textElements.forEach((text) => {
          text.setAttribute("fill", "#FFFFFF");
          text.setAttribute("font-weight", "bold");
        });
        
        // Style the edges with gradient colors
        const edgePaths = previewRef.current.querySelectorAll(".edgePath path");
        edgePaths.forEach((path) => {
          path.setAttribute("stroke-width", "2");
          path.setAttribute("stroke", "#6E59A5");
        });
      }
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
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomIn}
            className="p-1 h-8 w-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs w-14 text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
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
      <ScrollArea className="border rounded-md p-4 flex-1 bg-white relative">
        <div 
          className="min-h-[500px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ref={contentRef}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {isGenerating ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              ref={previewRef} 
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease'
              }}
            ></div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FlowchartPreview;
