import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPdfData } from "@/utils/pdfStorage";
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

const FlowchartModal = ({ open, onOpenChange, embedded = false }: FlowchartModalProps) => {
  const [flowchart, setFlowchart] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFlowchart = async () => {
      if (open) {
        try {
          setIsLoading(true);
          // Simulate fetching flowchart - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 500));
          const pdfText = await getPdfData();
          setFlowchart(pdfText ? 
            `graph TD;\n    A[Start] --> B[Process];\n    B --> C[Decision];\n    C -->|Yes| D[End];\n    C -->|No| B;` : 
            "No PDF text available for flowchart. Please ensure a document is loaded.");
        } catch (error) {
          console.error("Error fetching flowchart:", error);
          toast({
            title: "Flowchart Error",
            description: "Failed to generate flowchart. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFlowchart();
  }, [open, toast]);

  const content = (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
          <p>Generating flowchart...</p>
        </div>
      ) : (
        <div className="prose max-w-none dark:prose-invert">
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{flowchart}</code>
          </pre>
        </div>
      )}
    </>
  );

  // Render as embedded content if embedded prop is true
  if (embedded) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Document Flowchart</h2>
        {content}
      </div>
    );
  }

  // Otherwise render as modal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Flowchart</DialogTitle>
        </DialogHeader>
        {content}
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
