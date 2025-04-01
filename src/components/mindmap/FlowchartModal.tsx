import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";
import { useFlowchartGenerator } from './flowchart/useFlowchartGenerator';
import FlowchartEditor from './flowchart/FlowchartEditor';

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-[90%]" style={{ height: '80vh' }}>
        <ModalHeader>
          <p className="text-lg font-semibold">Generate Flowchart</p>
          <ModalCloseButton />
        </ModalHeader>

        <div className="flex flex-col h-full">
          <FlowchartEditor 
            mermaidCode={mermaidCode}
            isGenerating={loading}
            generateFlowchart={generateFlowchart}
            handleCodeChange={handleCodeChange}
          />

          {error && (
            <div className="text-red-500 mt-2">
              Error: {error}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerateFlowchart} disabled={loading}>
            {loading ? "Generating..." : "Generate Flowchart"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FlowchartModal;
