
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

  useEffect(() => {
    if (open) {
      // Reset error state
      setRenderError(null);
      setIsRendering(true);
      
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

      // Give DOM time to render before attempting mermaid render
      setTimeout(() => {
        renderMermaidDiagram();
      }, 200);
    }
  }, [open]);

  const renderMermaidDiagram = () => {
    if (!mermaidRef.current) return;
    
    // Clear previous renders
    mermaidRef.current.innerHTML = '';
    setIsRendering(true);
    
    // Research paper structure as a traditional flowchart
    const diagram = `
      flowchart TD
        subgraph "Research Paper Structure"
          Start([Start Reading]) --> Abstract
          Abstract --> Introduction
          Introduction --> Literature
          Literature --> Methodology
          Methodology --> Results
          Results --> Discussion
          Discussion --> Conclusion
          Conclusion --> References
          References --> End([End Reading])
          
          Introduction --> Problem["Problem Statement"]
          Introduction --> Objectives["Research Objectives"] 
          Introduction --> Scope["Scope of Study"]
          
          Methodology --> Design["Research Design"]
          Methodology --> Collection["Data Collection"]
          Methodology --> Analysis["Data Analysis"]
          Methodology --> Ethics["Ethical Considerations"]
          
          Results --> MainFindings["Key Findings"]
          Results --> DataViz["Data Visualization"]
          Results --> StatAnalysis["Statistical Analysis"]
          
          Discussion --> Interpretation["Results Interpretation"] 
          Discussion --> Comparison["Comparison with Literature"]
          Discussion --> Limitations["Study Limitations"]
          Discussion --> Implications["Theoretical & Practical Implications"]
          
          Conclusion --> Summary["Summary of Findings"]
          Conclusion --> Contribution["Contribution to Field"]
          Conclusion --> Future["Future Research Directions"]
        end
        
        style Start fill:#d0f4de,stroke:#333,stroke-width:2px
        style End fill:#d0f4de,stroke:#333,stroke-width:2px
        style Abstract fill:#a9def9,stroke:#333,stroke-width:1px
        style Introduction fill:#e4c1f9,stroke:#333,stroke-width:1px
        style Literature fill:#e4c1f9,stroke:#333,stroke-width:1px
        style Methodology fill:#fcf6bd,stroke:#333,stroke-width:1px
        style Results fill:#ff99c8,stroke:#333,stroke-width:1px
        style Discussion fill:#d0f4de,stroke:#333,stroke-width:1px
        style Conclusion fill:#a9def9,stroke:#333,stroke-width:1px
        style References fill:#e4c1f9,stroke:#333,stroke-width:1px
    `;

    try {
      mermaid.render("mermaid-diagram", diagram)
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
    link.download = 'research-paper-structure.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Research Paper Structure</DialogTitle>
          <DialogDescription>
            A flowchart showing the overall structure and flow of a research paper
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-white rounded-md overflow-auto max-h-[calc(80vh-120px)]">
          {renderError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>{renderError}</p>
              <Button 
                variant="outline" 
                onClick={renderMermaidDiagram}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : isRendering ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="h-12 w-12 mb-2 animate-spin text-purple-500" />
              <p>Rendering diagram...</p>
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
            onClick={renderMermaidDiagram}
            disabled={isRendering}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRendering ? "animate-spin" : ""}`} /> 
            Refresh
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
