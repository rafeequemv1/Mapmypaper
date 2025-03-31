import { useEffect, useState, useRef } from "react";
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

  // Render diagram when code or theme changes
  useEffect(() => {
    if (code && previewRef.current) {
      renderDiagram();
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

  // The renderDiagram function needs to be updated
  const renderDiagram = async () => {
    if (!previewRef.current) return;

    try {
      // Safely clear the preview area before rendering a new chart
      while (previewRef.current.firstChild) {
        previewRef.current.removeChild(previewRef.current.firstChild);
      }

      // Create a unique ID for the diagram
      const id = `diagram-${Date.now()}`;
    
      // Configure mermaid with enhanced styling and selected theme
      mermaid.initialize({
        theme: theme,
        startOnLoad: true,
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis',
          rankSpacing: 100,
          nodeSpacing: 80,
          padding: 20,
          defaultRenderer: 'elk'
        },
        mindmap: {
          padding: 20,
          curve: 'basis'
        },
        themeVariables: {
          primaryColor: '#9b87f5',
          primaryTextColor: '#333',
          primaryBorderColor: '#7E69AB',
          lineColor: '#6E59A5',
          secondaryColor: '#D6BCFA',
          tertiaryColor: '#f2fcf5',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      });
    
      // Parse the diagram to verify syntax before rendering
      await mermaid.parse(code);
    
      // If parse succeeds, render the diagram
      const { svg } = await mermaid.render(id, code);
    
      // Make sure previewRef is still valid before updating the DOM
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
      
        // Check if it's a flowchart or mindmap to apply additional styling
        const isDiagramType = (type: string) => code.trim().toLowerCase().startsWith(type);
      
        if (isDiagramType('flowchart')) {
          // Apply flowchart-specific styling
          styleFlowchart(previewRef.current);
        } else if (isDiagramType('mindmap')) {
          // Apply mindmap-specific styling
          styleMindmap(previewRef.current);
        }
      }
    } catch (err) {
      console.error("Failed to render diagram:", err);
    
      // Display error message in preview area
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="text-red-500 p-4">
          <h3 class="font-bold">Rendering Error</h3>
          <p>${err instanceof Error ? err.message : "Unknown error"}</p>
        </div>`;
      }
    }
  };

  // Style flowchart elements - update for more beautiful visualization
  const styleFlowchart = (container: HTMLDivElement) => {
    // Post-process the SVG to add more colors to nodes and ensure rounded corners
    const nodeElements = container.querySelectorAll("g.node");
    const colors = [
      { fill: '#f9f7ff', stroke: '#8B5CF6' }, // Purple
      { fill: '#e6f7ff', stroke: '#0EA5E9' }, // Blue
      { fill: '#f2fcf5', stroke: '#10B981' }, // Green
      { fill: '#fff7ed', stroke: '#F97316' }, // Orange
      { fill: '#fdf4ff', stroke: '#D946EF' }, // Pink
      { fill: '#f5f3ff', stroke: '#8B5CF6' }, // Light Purple
      { fill: '#ecfdf5', stroke: '#059669' }, // Emerald
      { fill: '#f0f9ff', stroke: '#3B82F6' }, // Light Blue
      { fill: '#fef3c7', stroke: '#F59E0B' }, // Amber
      { fill: '#ffe4e6', stroke: '#EF4444' }  // Red
    ];
  
    let colorIndex = 0;
    nodeElements.forEach((node) => {
      const rect = node.querySelector("rect, circle, polygon, ellipse");
      if (rect) {
        const color = colors[colorIndex % colors.length];
        rect.setAttribute("fill", color.fill);
        rect.setAttribute("stroke", color.stroke);
        rect.setAttribute("stroke-width", "2");
      
        // Add rounded corners if it's a rectangle
        if (rect.tagName === 'rect') {
          rect.setAttribute("rx", "15");
          rect.setAttribute("ry", "15");
        }
      
        // Add drop shadow
        const defs = container.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filterId = `shadow-${colorIndex}`;
      
        // Create filter if it doesn't exist
        if (!container.querySelector(`#${filterId}`)) {
          const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
          filter.setAttribute('id', filterId);
          filter.setAttribute('x', '-20%');
          filter.setAttribute('y', '-20%');
          filter.setAttribute('width', '140%');
          filter.setAttribute('height', '140%');
        
          const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
          feDropShadow.setAttribute('dx', '2');
          feDropShadow.setAttribute('dy', '2');
          feDropShadow.setAttribute('stdDeviation', '3');
          feDropShadow.setAttribute('flood-opacity', '0.2');
          feDropShadow.setAttribute('flood-color', 'rgb(0, 0, 0)');
        
          filter.appendChild(feDropShadow);
          defs.appendChild(filter);
        
          if (!container.querySelector('defs')) {
            container.querySelector('svg')?.insertBefore(defs, container.querySelector('svg')?.firstChild);
          }
        }
      
        rect.setAttribute('filter', `url(#${filterId})`);
      
        colorIndex++;
      }
    });

    // Make text more readable
    const textElements = container.querySelectorAll("g.node text");
    textElements.forEach((text) => {
      text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
      text.setAttribute("font-size", "16px");
      text.setAttribute("fill", "#333333");
      text.setAttribute("font-weight", "500");
    });
  
    // Style the edges with gradient colors and increase width
    const edgePaths = container.querySelectorAll(".edgePath path");
    edgePaths.forEach((path) => {
      path.setAttribute("stroke-width", "2.5");
      path.setAttribute("stroke", "#6E59A5");
    });
  
    // Style arrowheads
    const markers = container.querySelectorAll("marker");
    markers.forEach((marker) => {
      const markerPath = marker.querySelector("path");
      if (markerPath) {
        markerPath.setAttribute("fill", "#6E59A5");
      }
    });
  
    // Add animation to flowchart elements - subtle fade-in
    nodeElements.forEach((node, index) => {
      const delay = index * 100;
      node.style.opacity = "0";
      node.style.animation = `fadeIn 0.5s ease-out ${delay}ms forwards`;
    });
  
    // Add the animation keyframes
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleElement);
  };

  // Style mindmap elements
  const styleMindmap = (container: HTMLDivElement) => {
    // Style nodes with vibrant colors
    const nodes = container.querySelectorAll(".mindmap-node>rect, .mindmap-node>circle, .mindmap-node>ellipse, .mindmap-node>polygon");
    const colors = [
      "#8B5CF6", "#D946EF", "#F97316", "#0EA5E9", 
      "#10B981", "#EF4444", "#F59E0B", "#6366F1"
    ];
    
    let colorIndex = 0;
    nodes.forEach((node) => {
      node.setAttribute("fill", colors[colorIndex % colors.length]);
      node.setAttribute("stroke", "#4B5563");
      colorIndex++;
    });

    // Style text to be more readable
    const texts = container.querySelectorAll(".mindmap-node text");
    texts.forEach((text) => {
      text.setAttribute("fill", "#FFFFFF");
      text.setAttribute("font-weight", "bold");
    });

    // Style edges to be more visible
    const edges = container.querySelectorAll(".mindmap-edge");
    edges.forEach((edge) => {
      const path = edge.querySelector("path");
      if (path) {
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke", "#6E59A5");
      }
    });
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
