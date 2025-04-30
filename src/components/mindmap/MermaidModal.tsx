
import React, { useEffect, useRef, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import mermaid from "mermaid";
import { generateFlowchartFromPdf } from "@/services/geminiService";

interface MermaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidModal: React.FC<MermaidModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Reset states and fetch new flowchart
      setRenderError(null);
      setIsRendering(true);
      setSvgContent("");
      setMermaidCode("");
      
      // Initialize mermaid with flowchart configuration
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          useMaxWidth: true,
          curve: 'basis',
        },
      });

      // Generate diagram code from PDF content using Gemini
      generateFlowchartFromPdfContent();
    }
  }, [open]);

  const generateFlowchartFromPdfContent = async () => {
    try {
      // Call Gemini service to generate flowchart code based on PDF content
      const flowchartCode = await generateFlowchartFromPdf();
      setMermaidCode(flowchartCode);
      
      // Give DOM time to render before attempting mermaid render
      setTimeout(() => {
        renderMermaidDiagram(flowchartCode);
      }, 200);
    } catch (error) {
      console.error("Error generating flowchart:", error);
      setRenderError("Failed to generate flowchart from document content.");
      setIsRendering(false);
    }
  };

  const renderMermaidDiagram = (diagramCode: string) => {
    if (!mermaidRef.current || !diagramCode) return;
    
    // Clear previous renders
    mermaidRef.current.innerHTML = '';
    setIsRendering(true);
    
    try {
      mermaid.render("mermaid-diagram", diagramCode)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
            setSvgContent(svg);
            setRenderError(null);
            setIsRendering(false);
          }
        })
        .catch(error => {
          console.error("Mermaid rendering promise error:", error);
          setRenderError("Failed to render the diagram. Please try again.");
          setIsRendering(false);
        });
    } catch (error) {
      console.error("Mermaid rendering failed:", error);
      setRenderError("Error initializing the diagram renderer.");
      setIsRendering(false);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document-flowchart.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setIsRendering(true);
    setRenderError(null);
    
    // Try regenerating the flowchart
    generateFlowchartFromPdfContent();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document Structure Flowchart</DialogTitle>
          <DialogDescription>
            AI-generated flowchart showing the structure and flow of this document
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-white rounded-md overflow-auto max-h-[calc(80vh-120px)]">
          {renderError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>{renderError}</p>
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : isRendering ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="h-12 w-12 mb-2 animate-spin text-purple-500" />
              <p>Generating and rendering flowchart...</p>
            </div>
          ) : (
            <div 
              ref={mermaidRef} 
              className="flex justify-center w-full min-h-[400px] items-center" 
            />
          )}
        </div>
        
        <div className="flex justify-end mt-4 gap-2">
          <Button 
            variant="secondary"
            onClick={handleRetry}
            disabled={isRendering}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRendering ? "animate-spin" : ""}`} /> 
            Regenerate
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadSVG}
            disabled={!svgContent || !!renderError || isRendering}
          >
            <Download className="mr-2 h-4 w-4" /> Download SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidModal;
