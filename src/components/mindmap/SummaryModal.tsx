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

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

const SummaryModal = ({ open, onOpenChange, embedded = false }: SummaryModalProps) => {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      if (open) {
        try {
          setIsLoading(true);
          // Simulate fetching summary - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 500));
          const pdfText = await getPdfData();
          setSummary(pdfText ? `Summary of the document (${pdfText.substring(0, 150)}...)` : 
            "No PDF text available for summary. Please ensure a document is loaded.");
        } catch (error) {
          console.error("Error fetching summary:", error);
          toast({
            title: "Summary Error",
            description: "Failed to generate summary. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();
  }, [open, toast]);

  const content = (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
          <p>Generating summary...</p>
        </div>
      ) : (
        <div className="prose max-w-none dark:prose-invert">
          <p>{summary}</p>
        </div>
      )}
    </>
  );

  // Render as embedded content if embedded prop is true
  if (embedded) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Document Summary</h2>
        {content}
      </div>
    );
  }

  // Otherwise render as modal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Summary</DialogTitle>
        </DialogHeader>
        {content}
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
