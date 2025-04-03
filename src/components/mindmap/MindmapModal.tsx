
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import mermaid from "mermaid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MindmapModal({ isOpen, onClose }: MindmapModalProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Demo mindmap code
  const mindmapCode = `mindmap
  root((Mindmap))
    Origins
      Long history
      Popularization
        British psychology author Tony Buzan
    Research
      On effectiveness
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`;

  // Initialize and render mermaid diagram when the modal opens
  useEffect(() => {
    if (isOpen && mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });
      
      try {
        // Clear existing content
        mermaidRef.current.innerHTML = "";
        
        // Create a unique ID for the diagram
        const id = "mermaid-diagram-" + Date.now();
        
        // Create a div with the unique ID
        const element = document.createElement("div");
        element.id = id;
        element.className = "mermaid";
        element.textContent = mindmapCode;
        
        // Append to container
        mermaidRef.current.appendChild(element);
        
        // Render the diagram
        mermaid.init(undefined, element);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<div class="p-4 text-red-500">Error rendering mindmap: ${error}</div>`;
        }
      }
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Mermaid Mindmap Demo</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <div className="p-4 overflow-auto">
          <div ref={mermaidRef} className="mermaid-container w-full min-h-[400px] flex items-center justify-center">
            <div className="text-gray-500">Loading mindmap...</div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Diagram Source Code:</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {mindmapCode}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
