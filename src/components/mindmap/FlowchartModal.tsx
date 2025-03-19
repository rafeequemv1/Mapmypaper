
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
import useFlowchartGenerator, { defaultFlowchart } from "./flowchart/useFlowchartGenerator";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange, resetGenerator } = useFlowchartGenerator();
  const generationAttempted = useRef(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open) {
      if (code === defaultFlowchart && !generationAttempted.current) {
        // Set a small delay to ensure the modal is fully rendered first
        const timer = setTimeout(() => {
          generateFlowchart();
          generationAttempted.current = true;
        }, 100);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Clean up when modal is closed
      resetGenerator();
      generationAttempted.current = false;
    }
  }, [open, generateFlowchart, code, resetGenerator]);

  // Handle modal close
  const handleModalClose = () => {
    // Clean up and close the modal
    resetGenerator();
    generationAttempted.current = false;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
          <DialogDescription>
            Create and edit flowcharts using Mermaid syntax. The initial flowchart is generated based on your PDF content.
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
              onRegenerate={generateFlowchart}
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
          <Button onClick={handleModalClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
