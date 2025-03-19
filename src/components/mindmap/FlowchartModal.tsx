
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
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { 
    code, 
    error, 
    isGenerating, 
    generateFlowchart, 
    handleCodeChange,
    cleanupResources 
  } = useFlowchartGenerator();
  
  // Initialize mermaid library
  const { cleanup: cleanupMermaid } = useMermaidInit();

  // Generate flowchart when modal is opened for the first time
  useEffect(() => {
    let isMounted = true;
    
    if (open) {
      if (code === defaultFlowchart) {
        try {
          generateFlowchart().catch(err => {
            if (isMounted) {
              console.error("Error generating flowchart:", err);
              toast({
                title: "Generation Error",
                description: "Failed to generate flowchart. You can try manually editing the code.",
                variant: "destructive"
              });
            }
          });
        } catch (error) {
          console.error("Unexpected error during flowchart generation:", error);
        }
      }
    }
    
    // Clean up when component unmounts
    return () => {
      isMounted = false;
      if (!open) {
        try {
          // Cleanup when closing
          cleanupResources();
          cleanupMermaid();
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    };
  }, [open, code, generateFlowchart, cleanupResources, cleanupMermaid, toast]);
  
  // Cleanup when modal closes
  const handleCloseModal = () => {
    try {
      // First call the cleanup functions
      cleanupResources();
      cleanupMermaid();
    } catch (error) {
      console.error("Error during modal close cleanup:", error);
    } finally {
      // Always notify parent that modal should close, even if cleanup had errors
      onOpenChange(false);
    }
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
          
          {/* Preview - Takes up 2/3 of the space on medium screens and up */}
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

export default FlowchartModal;
