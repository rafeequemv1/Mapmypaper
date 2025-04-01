
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFlowchartGenerator } from './flowchart/useFlowchartGenerator';
import FlowchartEditor from './flowchart/FlowchartEditor';

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { mermaidCode, loading, error, generateFlowchart, handleCodeChange } = useFlowchartGenerator();

  const handleGenerateFlowchart = useCallback(async () => {
    const pdfText = sessionStorage.getItem('pdfText');
    if (!pdfText) {
      toast({
        title: "Error",
        description: "No PDF text found. Please upload a PDF first.",
      });
      return;
    }

    await generateFlowchart(pdfText);
  }, [generateFlowchart, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%]" style={{ height: '80vh' }}>
        <DialogHeader>
          <DialogTitle>Generate Flowchart</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="flex flex-col h-full overflow-auto">
          <FlowchartEditor 
            code={mermaidCode}
            error={error}
            isGenerating={loading}
            onCodeChange={(e) => handleCodeChange(e.target.value)}
            onRegenerate={handleGenerateFlowchart}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerateFlowchart} disabled={loading}>
            {loading ? "Generating..." : "Generate Flowchart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
