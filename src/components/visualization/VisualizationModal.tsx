
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { VisualizationType } from "@/hooks/use-visualization";

// Initialize mermaid with colorful theme settings
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  themeVariables: {
    // Rich colorful theme variables
    primaryColor: "#8B5CF6", // Vivid Purple
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#7C3AED",
    lineColor: "#8B5CF6",
    secondaryColor: "#F97316", // Bright Orange
    tertiaryColor: "#0EA5E9", // Ocean Blue
    // Mindmap specific colors
    nodeBorder: "#7C3AED",
    mainBkg: "#F9F7FF",
    edgeLabelBackground: "#F9F7FF",
    // More vibrant colors for nodes
    nodeBkg: "#E5DEFF",
    // Flowchart specific colors
    clusterBkg: "#F9F7FF",
    clusterBorder: "#8B5CF6",
  },
  flowchart: {
    curve: 'basis',
    useMaxWidth: false,
    htmlLabels: true,
  },
  mindmap: {
    padding: 16,
    useMaxWidth: false,
  }
});

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationType: VisualizationType;
  mermaidSyntax: string;
  onSyntaxChange: (syntax: string) => void;
  isGenerating: boolean;
  onRegenerate: () => void;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({
  isOpen,
  onClose,
  visualizationType,
  mermaidSyntax,
  onSyntaxChange,
  isGenerating,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "syntax">("preview");
  const [renderKey, setRenderKey] = useState(0);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panEnabled, setPanEnabled] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Custom theme for mindmap to make it more colorful
  const applyCustomTheme = () => {
    if (visualizationType === "mindmap") {
      // Define a colorful mindmap theme
      const style = document.createElement('style');
      style.setAttribute('id', 'mermaid-mindmap-custom-theme');
      style.innerHTML = `
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
          fill: #E5DEFF !important;
          stroke: #8B5CF6 !important;
          stroke-width: 2px !important;
        }
        .node.mindmap-level-1 rect, .node.mindmap-level-1 circle, .node.mindmap-level-1 ellipse, .node.mindmap-level-1 polygon {
          fill: #F0DBFF !important;
          stroke: #9333EA !important;
        }
        .node.mindmap-level-2 rect, .node.mindmap-level-2 circle, .node.mindmap-level-2 ellipse, .node.mindmap-level-2 polygon {
          fill: #FEF3C7 !important;
          stroke: #F97316 !important;
        }
        .node.mindmap-level-3 rect, .node.mindmap-level-3 circle, .node.mindmap-level-3 ellipse, .node.mindmap-level-3 polygon {
          fill: #DBEAFE !important;
          stroke: #3B82F6 !important;
        }
        .node.mindmap-level-4 rect, .node.mindmap-level-4 circle, .node.mindmap-level-4 ellipse, .node.mindmap-level-4 polygon {
          fill: #FCE7F3 !important;
          stroke: #EC4899 !important;
        }
        .node.mindmap-level-5 rect, .node.mindmap-level-5 circle, .node.mindmap-level-5 ellipse, .node.mindmap-level-5 polygon {
          fill: #DCFCE7 !important;
          stroke: #10B981 !important;
        }
        .edgePath .path {
          stroke-width: 2px !important;
        }
        .mindmap-root > g > rect {
          fill: #F5F3FF !important;
          stroke: #8B5CF6 !important;
          stroke-width: 2px !important;
        }
        .mindmap-node-label {
          font-weight: 500 !important;
        }
        .mindmap-root > g > .mindmap-node-label {
          font-weight: 700 !important;
          font-size: 18px !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('mermaid-mindmap-custom-theme');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  };
  
  // Re-render mermaid diagram when syntax changes
  useEffect(() => {
    if (isOpen && mermaidSyntax && mermaidRef.current && activeTab === "preview") {
      // Apply custom theme for mindmap
      const cleanup = applyCustomTheme();
      
      try {
        mermaidRef.current.innerHTML = "";
        mermaid.render(`mermaid-${renderKey}`, mermaidSyntax).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
            
            // Add zoom and pan functionality to SVG
            const svgElement = mermaidRef.current.querySelector('svg');
            if (svgElement) {
              // Make SVG responsive and fit container
              svgElement.setAttribute('width', '100%');
              svgElement.setAttribute('height', '100%');
              svgElement.style.maxHeight = '100%';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
            }
          }
        });
      } catch (error) {
        console.error("Error rendering mermaid diagram:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div class="p-4 text-red-500">Error rendering diagram: ${error.message}</div>`;
        }
      }
      
      return cleanup;
    }
  }, [mermaidSyntax, isOpen, activeTab, renderKey, visualizationType]);
  
  // Apply zoom and pan transformations
  useEffect(() => {
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        const contentElement = svgElement.querySelector('g');
        if (contentElement) {
          contentElement.style.transform = `scale(${zoom}) translate(${panPosition.x}px, ${panPosition.y}px)`;
          contentElement.style.transformOrigin = 'center';
          contentElement.style.transition = isDragging ? 'none' : 'transform 0.2s';
        }
      }
    }
  }, [zoom, panPosition, isDragging]);
  
  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panEnabled) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && panEnabled) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setPanPosition(prev => ({ 
        x: prev.x + dx, 
        y: prev.y + dy 
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Zoom controls
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };
  
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const togglePan = () => {
    setPanEnabled(!panEnabled);
  };
  
  const resetView = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };
  
  // Handle syntax change
  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSyntaxChange(e.target.value);
  };
  
  // Force re-render of the diagram
  const refreshDiagram = () => {
    setRenderKey(prev => prev + 1);
  };
  
  // Download SVG
  const downloadSVG = () => {
    if (!mermaidRef.current) return;
    
    const svgData = mermaidRef.current.innerHTML;
    if (!svgData) return;
    
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${visualizationType}-diagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const title = visualizationType === "mindmap" 
    ? "Mind Map Visualization" 
    : "Flowchart Visualization";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "preview" | "syntax")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="syntax">Edit Syntax</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              {activeTab === "preview" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={zoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant={panEnabled ? "default" : "outline"}
                    size="sm" 
                    onClick={togglePan}
                    title="Pan Mode"
                    className={panEnabled ? "bg-blue-100" : ""}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetView}
                    title="Reset View"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRegenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSVG}
                disabled={!mermaidSyntax || activeTab !== "preview"}
              >
                <Download className="h-4 w-4 mr-2" />
                Download SVG
              </Button>
            </div>
          </div>
          
          <TabsContent 
            value="preview" 
            className="flex-1 overflow-auto border rounded-md p-4 bg-white"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  <p>Generating {visualizationType}...</p>
                </div>
              </div>
            ) : mermaidSyntax ? (
              <div 
                ref={mermaidRef} 
                className="mermaid-container overflow-auto h-full w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: panEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              ></div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No {visualizationType} diagram available. Click Regenerate to create one.
              </div>
            )}
          </TabsContent>
          
          <TabsContent 
            value="syntax" 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <p className="text-sm text-gray-500 mb-2">
              Edit the Mermaid syntax below to customize your {visualizationType} diagram:
            </p>
            <Textarea 
              value={mermaidSyntax} 
              onChange={handleSyntaxChange}
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              placeholder={`Enter your ${visualizationType} syntax here...`}
              disabled={isGenerating}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizationModal;
