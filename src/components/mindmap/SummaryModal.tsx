import React, { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateStructuredSummary } from '@/services/geminiService';

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const [summaryText, setSummaryText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pdfText = sessionStorage.getItem('pdfText') || '';
      if (!pdfText) {
        throw new Error('No PDF text found to generate summary');
      }
      
      const summary = await generateStructuredSummary(pdfText);
      setSummaryText(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Summary Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate summary from PDF text',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summaryText);
    toast({
      title: "Copied to clipboard",
      description: "The summary text has been copied to your clipboard.",
    });
  }, [summaryText, toast]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Summary</AlertDialogTitle>
          <AlertDialogDescription>
            Generate a structured summary of the PDF content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Generated summary will appear here..."
            value={summaryText}
            readOnly
            className="resize-none"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button 
            type="button" 
            onClick={handleGenerate} 
            disabled={isGenerating}
            isLoading={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Summary'}
          </Button>
          <Button 
            type="button" 
            onClick={handleCopy} 
            disabled={!summaryText}
          >
            Copy to Clipboard
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SummaryModal;
