
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
import { getPdfText } from "@/utils/pdfStorage";
import { generateFlowchartFromText } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";

interface MermaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfKey?: string | null;
}

const MermaidModal: React.FC<MermaidModalProps> = ({ 
  open, 
  onOpenChange,
  pdfKey
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const { toast } = useToast();

  // Generate flowchart when modal opens or PDF changes
  useEffect(() => {
    if (open && pdfKey) {
      generateFlowchart();
    } else if (open) {
      // Default diagram when no PDF is selected
      const defaultDiagram = getDefaultDiagram();
      setMermaidCode(defaultDiagram);
      renderMermaidDiagram(defaultDiagram);
    }
  }, [open, pdfKey]);

  // Generate flowchart from PDF text
  const generateFlowchart = async () => {
    if (!pdfKey) return;
    
    setIsLoading(true);
    setRenderError(null);
    
    try {
      // Get the PDF text from storage
      const pdfText = await getPdfText(pdfKey);
      
      if (!pdfText || pdfText.trim() === "") {
        toast({
          title: "No text found",
          description: "Could not find text for this PDF.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Generate flowchart syntax using Gemini
      const flowchartSyntax = await generateFlowchartFromText(pdfText);
      setMermaidCode(flowchartSyntax);
      
      // Render the generated flowchart
      renderMermaidDiagram(flowchartSyntax);
    } catch (error) {
      console.error("Error generating flowchart:", error);
      setRenderError("Failed to generate flowchart from PDF text.");
      // Fall back to default diagram
      const defaultDiagram = getDefaultDiagram();
      setMermaidCode(defaultDiagram);
      renderMermaidDiagram(defaultDiagram);
      
      toast({
        title: "Flowchart generation failed",
        description: "Using default research paper structure instead.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get default diagram for research papers
  const getDefaultDiagram = () => {
    return `
      graph TD
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
  };

  const renderMermaidDiagram = (diagram: string) => {
    if (!mermaidRef.current) return;
    
    // Clear previous renders
    mermaidRef.current.innerHTML = '';
    
    try {
      // Initialize mermaid with configuration
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          useMaxWidth: false,
        },
      });
      
      // Render the diagram
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
          setRenderError("Failed to render the diagram. The generated syntax may be invalid.");
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
    link.download = pdfKey ? `${pdfKey.split('_')[0]}-flowchart.svg` : 'research-paper-structure.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateFlowchart = () => {
    generateFlowchart();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {pdfKey ? `${pdfKey.split('_')[0]} - Document Structure` : 'Research Paper Structure'}
          </DialogTitle>
          <DialogDescription>
            {pdfKey 
              ? 'A flowchart representing the structure of this document' 
              : 'A generic flowchart showing the structure of a research paper'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-white rounded-md overflow-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="h-12 w-12 mb-2 animate-spin text-primary" />
              <p>Generating flowchart from document text...</p>
            </div>
          ) : renderError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>{renderError}</p>
              <Button 
                variant="outline" 
                onClick={handleRegenerateFlowchart}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div ref={mermaidRef} className="flex justify-center w-full min-h-[300px] items-center" />
          )}
        </div>
        
        <div className="flex justify-between mt-4">
          {pdfKey && (
            <Button 
              variant="outline" 
              onClick={handleRegenerateFlowchart}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              Regenerate
            </Button>
          )}
          <div className="ml-auto">
            <Button 
              variant="outline" 
              onClick={handleDownloadSVG}
              disabled={!svgContent || !!renderError || isLoading}
            >
              <Download className="mr-2 h-4 w-4" /> Download SVG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidModal;
