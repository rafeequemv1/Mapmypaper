
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { Loader } from "lucide-react";

interface MermaidMindMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindMapModal: React.FC<MermaidMindMapModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [mermaidSyntax, setMermaidSyntax] = useState<string>(
`mindmap
  root((MapMyPaper))::purple
    [Research Paper]::blue
      (Introduction)::cyan
        Background::teal
        Objectives::teal
      (Methods)::green
        Data Collection::lightgreen
        Analysis::lightgreen
      (Results)::orange
        Key Findings::yellow
        Charts & Tables::yellow
      (Discussion)::red
        Implications::pink
        Limitations::pink
      (Conclusion)::purple
        Summary::violet
        Future Research::violet`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (open) {
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

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidSyntax(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    try {
      setIsGenerating(true);
      // Use Gemini to generate a mindmap syntax from the PDF content
      const generatedMindmap = await generateMindmapFromPdf();
      setMermaidSyntax(generatedMindmap);
    } catch (error) {
      console.error("Error generating mindmap from paper:", error);
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
                disabled={isGenerating}
                className="text-xs"
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
