import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, X } from "lucide-react";
import { VisualizationType } from "@/hooks/use-visualization";

// Initialize mermaid with colorful theme settings
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  themeVariables: {
    // Colorful theme variables for mindmap
    primaryColor: "#8B5CF6", // Purple
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#7C3AED",
    lineColor: "#8B5CF6",
    secondaryColor: "#F97316", // Orange
    tertiaryColor: "#3B82F6", // Blue
    // Mindmap specific colors
    nodeBorder: "#7C3AED",
    mainBkg: "#F9F7FF",
    edgeLabelBackground: "#F9F7FF",
    // More vibrant colors for nodes
    nodeBkg: "#E5DEFF",
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
  
  // Custom theme for mindmap to make it more colorful
  const applyCustomTheme = () => {
    if (visualizationType === "mindmap") {
      // Define a colorful mindmap theme
      const colorfulMindmapTheme = {
        "mindmap": {
          // Colors from the purple palette with additional vibrant colors
          "nodeColors": [
            "#8B5CF6", // Purple
            "#F97316", // Orange
            "#3B82F6", // Blue
            "#EC4899", // Pink
            "#10B981", // Green
            "#6366F1", // Indigo
            "#EF4444", // Red
            "#F59E0B", // Amber
            "#14B8A6", // Teal
            "#8B5CF6", // Purple (repeated)
            "#F97316", // Orange (repeated)
            "#3B82F6", // Blue (repeated)
          ],
          "fontSize": "16px",
          "fontFamily": "Inter, sans-serif",
          "curve": "basis",
          "border": "2px solid",
          "padding": "24px",
          "useMaxWidth": "false"
        }
      };
      
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
              svgElement.style.maxWidth = '100%';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
              
              // Add viewBox if it doesn't exist for better scaling
              if (!svgElement.getAttribute('viewBox')) {
                const width = svgElement.getAttribute('width') || '800';
                const height = svgElement.getAttribute('height') || '600';
                svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
              }
              
              // Update width and height to 100% for better fit
              const container = mermaidRef.current;
              if (container) {
                setTimeout(() => {
                  const containerWidth = container.clientWidth;
                  const containerHeight = container.clientHeight;
                  svgElement.setAttribute('width', '100%');
                  svgElement.setAttribute('height', '100%');
                  
                  // Adjust the viewBox for better scaling
                  const viewBox = svgElement.getAttribute('viewBox')?.split(' ');
                  if (viewBox && viewBox.length === 4) {
                    const vbWidth = parseFloat(viewBox[2]);
                    const vbHeight = parseFloat(viewBox[3]);
                    const scale = Math.min(containerWidth / vbWidth, containerHeight / vbHeight);
                    
                    // Apply transform scale and translation for centering
                    const g = svgElement.querySelector('g');
                    if (g) {
                      g.setAttribute('transform', `scale(${scale})`);
                      // Center the diagram
                      const boundingBox = g.getBBox();
                      const tx = (containerWidth / scale - boundingBox.width) / 2 - boundingBox.x;
                      const ty = (containerHeight / scale - boundingBox.height) / 2 - boundingBox.y;
                      g.setAttribute('transform', `scale(${scale}) translate(${tx}, ${ty})`);
                    }
                  }
                }, 50);
              }
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
  
  const title = "Mind Map Visualization";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] flex flex-col overflow-hidden p-4">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
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
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshDiagram}
                disabled={activeTab !== "preview"}
              >
                <RefreshCw className="h-4 w-4" />
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
                  <p>Generating mindmap...</p>
                </div>
              </div>
            ) : mermaidSyntax ? (
              <div 
                ref={mermaidRef} 
                className="mermaid-container overflow-auto h-full w-full flex items-center justify-center"
              ></div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No mindmap diagram available. Click Regenerate to create one.
              </div>
            )}
          </TabsContent>
          
          <TabsContent 
            value="syntax" 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <p className="text-sm text-gray-500 mb-2">
              Edit the Mermaid syntax below to customize your mindmap diagram:
            </p>
            <Textarea 
              value={mermaidSyntax} 
              onChange={handleSyntaxChange}
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              placeholder="Enter your mindmap syntax here..."
              disabled={isGenerating}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizationModal;
