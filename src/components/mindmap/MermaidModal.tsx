
import React, { useEffect, useRef, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      // Reset error state
      setRenderError(null);
      
      // Initialize mermaid with more explicit configuration
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          useMaxWidth: false,
        },
      });

      // Give DOM time to render before attempting mermaid render
      setTimeout(() => {
        renderMermaidDiagram();
      }, 100);
    }
  }, [open]);

  const renderMermaidDiagram = () => {
    if (!mermaidRef.current) return;
    
    // Clear previous renders
    mermaidRef.current.innerHTML = '';
    
    // Research paper structure flowchart
    const diagram = `
      graph LR
        title[Research Paper Structure]
        title --> abstract[Abstract]
        title --> intro[Introduction]
        title --> methods[Methodology]
        title --> results[Results]
        title --> discuss[Discussion]
        title --> concl[Conclusion]
        title --> refs[References]
        
        intro --> background[Background & Context]
        intro --> problem[Problem Statement]
        intro --> significance[Research Significance]
        intro --> objectives[Research Objectives]
        
        methods --> design[Research Design]
        methods --> data[Data Collection]
        methods --> analysis[Data Analysis]
        methods --> ethics[Ethical Considerations]
        
        results --> findings[Key Findings]
        results --> tables[Tables & Figures]
        results --> stats[Statistical Analysis]
        
        discuss --> interpret[Interpretation]
        discuss --> compare[Comparison with Literature]
        discuss --> limitations[Limitations]
        discuss --> implications[Implications]
        
        concl --> summary[Summary of Findings]
        concl --> contribution[Contribution to Field]
        concl --> future[Future Research Directions]
        
        classDef highlight fill:#f9f,stroke:#333,stroke-width:2px;
        class title highlight;
    `;

    try {
      mermaid.render("mermaid-diagram", diagram)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
            setSvgContent(svg);
            setRenderError(null);
          }
        })
        .catch(error => {
          console.error("Mermaid rendering promise error:", error);
          setRenderError("Failed to render the diagram. Please try again.");
        });
    } catch (error) {
      console.error("Mermaid rendering failed:", error);
      setRenderError("Error initializing the diagram renderer.");
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
            A flowchart showing the structure of a research paper
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
          ) : (
            <div ref={mermaidRef} className="flex justify-center w-full min-h-[300px] items-center" />
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadSVG}
            disabled={!svgContent || !!renderError}
          >
            <Download className="mr-2 h-4 w-4" /> Download SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidModal;
