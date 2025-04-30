
import React, { useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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

  useEffect(() => {
    if (open && mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });

      // Clear previous renders
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
      }

      const diagram = `
        graph TD
          A[Start] --> B{Is it a document?}
          B -->|Yes| C[PDF Processing]
          B -->|No| D[Text Processing]
          C --> E[Generate Mind Map]
          D --> E
          E --> F[Add to Knowledge Base]
          F --> G[End]
      `;

      try {
        mermaid.render("mermaid-diagram", diagram).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        });
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Document Processing Flow</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-white rounded-md overflow-auto max-h-[70vh]">
          <div ref={mermaidRef} className="flex justify-center" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidModal;
