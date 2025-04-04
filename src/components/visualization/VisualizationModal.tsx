
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw } from "lucide-react";
import { VisualizationType } from "@/hooks/use-visualization";

// Initialize mermaid with colorful theme
mermaid.initialize({
  startOnLoad: true,
  theme: "forest",
  themeVariables: {
    primaryColor: "#9b87f5",
    primaryTextColor: "#fff",
    primaryBorderColor: "#7E69AB",
    lineColor: "#6E59A5",
    secondaryColor: "#D6BCFA",
    tertiaryColor: "#E5DEFF"
  },
  fontFamily: "Inter, sans-serif",
  securityLevel: "loose",
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
  
  // Re-render mermaid diagram when syntax changes
  useEffect(() => {
    if (isOpen && mermaidSyntax && mermaidRef.current && activeTab === "preview") {
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
    }
  }, [mermaidSyntax, isOpen, activeTab, renderKey]);
  
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
                  <p>Generating {visualizationType}...</p>
                </div>
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
