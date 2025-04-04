
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { generateFlowchartFromPdf } from "@/services/geminiService";
import { Loader } from "lucide-react";
import { isPdfAvailable } from "@/utils/pdfStorage";
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [flowchartSyntax, setFlowchartSyntax] = useState<string>(
`flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process One]
  B -->|No| D[Process Two]
  C --> E[End]
  D --> E`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  
  // Check if PDF is available when component mounts or modal opens
  useEffect(() => {
    if (open) {
      checkPdfAvailability();
      
      try {
        mermaid.initialize({
          startOnLoad: true,
          theme: "default",
          securityLevel: "loose",
        });
        
        setTimeout(() => {
          mermaid.contentLoaded();
        }, 100);
      } catch (error) {
        console.error("Error initializing mermaid:", error);
      }
    }
  }, [open, flowchartSyntax]);

  // Check if PDF content is available
  const checkPdfAvailability = async () => {
    const hasPdf = await isPdfAvailable();
    setIsPdfLoaded(hasPdf);
    
    if (!hasPdf) {
      console.log("No PDF content is available for generating a flowchart");
    } else {
      console.log("PDF content is available for flowchart generation");
    }
  };

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFlowchartSyntax(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    if (!isPdfLoaded) {
      toast({
        title: "No paper content available",
        description: "Please upload a PDF paper first before generating a flowchart.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      // Use Gemini to generate a flowchart syntax from the PDF content
      const generatedFlowchart = await generateFlowchartFromPdf();
      
      if (generatedFlowchart && generatedFlowchart.trim() !== '') {
        setFlowchartSyntax(generatedFlowchart);
        toast({
          title: "Flowchart generated",
          description: "Successfully created flowchart from your paper content."
        });
      } else {
        toast({
          title: "Generation issue",
          description: "Couldn't generate a proper flowchart. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating flowchart from paper:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flowchart",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      // Ensure mermaid re-renders the diagram
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Edit Flowchart Syntax</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGenerateFromPaper}
                disabled={isGenerating || !isPdfLoaded}
                className="text-xs"
                title={!isPdfLoaded ? "Upload a PDF first to enable this feature" : ""}
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : "Generate from Paper"}
              </Button>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              value={flowchartSyntax}
              onChange={handleSyntaxChange}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-semibold">Syntax Tips:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Start with <code>flowchart TD</code> for top-down flow</li>
                <li>Node shapes: <code>A[Rectangle]</code>, <code>B(Rounded)</code>, <code>C{"{"}Hexagon{"}"}</code>, <code>D{">"}"Diamond"{"<"}</code></li>
                <li>Arrows: <code>--&gt;</code> for lines, <code>--&gt;|text|</code> for labels</li>
                <li>Styling: <code>style A fill:#f9f,stroke:#333</code></li>
                <li>Subgraphs: <code>subgraph title ... end</code></li>
              </ul>
            </div>
          </div>
          
          {/* Flowchart preview */}
          <div className="w-full md:w-3/5 border rounded-md p-4 overflow-auto bg-white">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="mermaid-container overflow-auto">
              <div className="mermaid">{flowchartSyntax}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
