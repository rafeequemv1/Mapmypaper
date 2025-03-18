
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  const { code, error, isGenerating, generateDiagram, handleCodeChange } = useSequenceDiagramGenerator();
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setHasAttemptedGeneration(false);
    }
  }, [open]);

  // Generate diagram when modal is opened
  useEffect(() => {
    if (open && !hasAttemptedGeneration) {
      // Check if we have PDF data before attempting generation
      const hasPdfData = !!sessionStorage.getItem('pdfData') || 
                         !!sessionStorage.getItem('uploadedPdfData') || 
                         !!sessionStorage.getItem('pdfText');
      
      if (hasPdfData) {
        generateDiagram().catch(error => {
          console.error("Error during diagram generation:", error);
          // Don't throw error, just log it to prevent app crash
        });
      }
      
      setHasAttemptedGeneration(true);
    }
  }, [open, generateDiagram, hasAttemptedGeneration, code]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Generating sequence diagram...</span>
              </div>
            ) : (
              <FlowchartPreview
                code={code}
                error={error}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} />
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SequenceDiagramModal;
