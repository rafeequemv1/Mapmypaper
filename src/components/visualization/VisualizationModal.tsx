
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw } from "lucide-react";
import { VisualizationType } from "@/hooks/use-visualization";

// Initialize mermaid with colorful theme settings and proper configuration
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, sans-serif",
  themeVariables: {
    // Colorful theme variables for mindmap and flowchart
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
    // Flowchart specific colors
    clusterBkg: "#F9F7FF",
    clusterBorder: "#8B5CF6",
  },
  flowchart: {
    curve: 'basis',
    useMaxWidth: false,
    htmlLabels: true,
    defaultRenderer: 'dagre-wrapper' // Changed from 'dagre' to 'dagre-wrapper'
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
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Function to fix common flowchart syntax issues
  const fixFlowchartSyntax = (syntax: string): string => {
    if (visualizationType !== "flowchart") return syntax;
    
    let fixedSyntax = syntax;
    
    // Make sure flowchart has a direction
    if (!fixedSyntax.match(/flowchart\s+(TD|TB|BT|RL|LR)/i)) {
      fixedSyntax = fixedSyntax.replace(/flowchart/i, 'flowchart TD');
    }
    
    // Fix issues with "end" nodes - capitalize End
    fixedSyntax = fixedSyntax.replace(/\[(end)\]/gi, (match, p1) => {
      if (p1 === 'end') return '[End]';
      return match;
    });
    
    // Fix any issues with nodes starting with o or x by adding space
    fixedSyntax = fixedSyntax.replace(/---([ox])/g, '--- $1');
    
    return fixedSyntax;
  };
  
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
        // Clear previous error
        setRenderError(null);
        
        // Clear previous content
        mermaidRef.current.innerHTML = "";
        
        // Fix any flowchart syntax issues
        const processedSyntax = fixFlowchartSyntax(mermaidSyntax);
        
        // Render the diagram
        mermaid.render(`mermaid-${renderKey}`, processedSyntax).then(({ svg }) => {
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
        }).catch(error => {
          console.error("Error rendering mermaid diagram:", error);
          setRenderError(error.message);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="p-4 text-red-500">Error rendering diagram: ${error.message}</div>`;
          }
        });
      } catch (error) {
        console.error("Error in mermaid rendering:", error);
        setRenderError(error instanceof Error ? error.message : String(error));
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div class="p-4 text-red-500">Error rendering diagram: ${error instanceof Error ? error.message : String(error)}</div>`;
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
  
  const title = visualizationType === "mindmap" 
    ? "Mind Map Visualization" 
    : "Flowchart Visualization";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-4">
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
                disabled={!mermaidSyntax || activeTab !== "preview" || !!renderError}
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
                  <p>Generating {visualizationType}...</p>
                </div>
              </div>
            ) : renderError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <p className="font-semibold mb-2">Error rendering diagram:</p>
                <p className="text-sm bg-red-50 p-3 rounded max-w-md">{renderError}</p>
                <p className="mt-4 text-gray-600">Try switching to the "Edit Syntax" tab to fix the issues or click "Regenerate".</p>
              </div>
            ) : mermaidSyntax ? (
              <div ref={mermaidRef} className="mermaid-container overflow-auto h-full w-full"></div>
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
            {renderError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2 mb-2 rounded text-sm">
                <strong>Note:</strong> There are syntax errors in your diagram. Common flowchart issues include:
                <ul className="list-disc pl-5 mt-1">
                  <li>Using lowercase "end" - use "End" instead</li>
                  <li>Starting node names with "o" or "x" without a space</li>
                  <li>Missing direction specifier (TD, LR, etc.)</li>
                </ul>
              </div>
            )}
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
