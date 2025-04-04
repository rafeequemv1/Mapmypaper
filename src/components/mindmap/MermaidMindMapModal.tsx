
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mermaid Mindmap Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <p className="text-sm text-muted-foreground mb-2">Edit Mindmap Syntax</p>
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
