
import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FlowchartEditor from "./flowchart/FlowchartEditor";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useSequenceDiagramGenerator, { defaultSequenceDiagram } from "./flowchart/useSequenceDiagramGenerator";

interface SequenceDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SequenceDiagramModal = ({ open, onOpenChange }: SequenceDiagramModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateDiagram, handleCodeChange, cleanupResources } = useSequenceDiagramGenerator();
  
  // Initialize mermaid library
  const { cleanup: cleanupMermaid } = useMermaidInit();

  // Generate diagram when modal is opened
  useEffect(() => {
    if (open) {
      if (code === defaultSequenceDiagram) {
        generateDiagram();
      }
    }
  }, [open, generateDiagram, code]);
  
  // Handle modal close with cleanup
  const handleCloseModal = () => {
    // First call the cleanup functions
    cleanupResources();
    cleanupMermaid();
    
    // Then notify parent that modal should close with a small delay
    setTimeout(() => {
      onOpenChange(false);
    }, 10);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCloseModal();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sequence Diagram Editor</DialogTitle>
          <DialogDescription>
            Create and edit sequence diagrams using Mermaid syntax. The initial diagram is generated based on your PDF content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Code editor */}
          <div className="flex flex-col">
            <FlowchartEditor
              code={code}
              error={error}
              isGenerating={isGenerating}
              onCodeChange={handleCodeChange}
              onRegenerate={generateDiagram}
            />
          </div>
          
          {/* Preview - Now takes up 2/3 of the space on medium screens and up */}
          <div className="md:col-span-2 flex flex-col">
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} />
          <Button onClick={handleCloseModal}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SequenceDiagramModal;
