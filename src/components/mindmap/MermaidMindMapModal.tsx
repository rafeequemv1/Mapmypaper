
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { Loader } from "lucide-react";
import { isPdfAvailable } from "@/utils/pdfStorage";
import { useToast } from "@/hooks/use-toast";

interface MermaidMindMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindMapModal: React.FC<MermaidMindMapModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [mermaidSyntax, setMermaidSyntax] = useState<string>(
`mindmap
  root((MapMyPaper))
    Research Paper
      Introduction
        Background
        Objectives
      Methods
        Data Collection
        Analysis
      Results
        Key Findings
        Charts & Tables
      Discussion
        Implications
        Limitations
      Conclusion
        Summary
        Future Research`
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
  }, [open, mermaidSyntax]);

  // Check if PDF content is available
  const checkPdfAvailability = async () => {
    const hasPdf = await isPdfAvailable();
    setIsPdfLoaded(hasPdf);
    
    if (!hasPdf) {
      console.log("No PDF content is available for generating a mindmap");
    } else {
      console.log("PDF content is available for mindmap generation");
    }
  };

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidSyntax(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    if (!isPdfLoaded) {
      toast({
        title: "No paper content available",
        description: "Please upload a PDF paper first before generating a mindmap.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      // Use Gemini to generate a mindmap syntax from the PDF content
      const generatedMindmap = await generateMindmapFromPdf();
      
      if (generatedMindmap && generatedMindmap.trim() !== '') {
        setMermaidSyntax(generatedMindmap);
        toast({
          title: "Mindmap generated",
          description: "Successfully created mindmap from your paper content."
        });
      } else {
        toast({
          title: "Generation issue",
          description: "Couldn't generate a proper mindmap. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating mindmap from paper:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate mindmap",
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
          <DialogTitle>Mermaid Mindmap Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Edit Mindmap Syntax</p>
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
              value={mermaidSyntax}
              onChange={handleSyntaxChange}
            />
          </div>
          
          {/* Mindmap preview */}
          <div className="w-full md:w-3/5 border rounded-md p-4 overflow-auto bg-white">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="mermaid-container overflow-auto">
              <div className="mermaid">{mermaidSyntax}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindMapModal;
