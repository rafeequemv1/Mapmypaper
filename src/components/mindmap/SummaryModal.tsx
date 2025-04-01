
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { generateStructuredSummary } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Summary {
  Summary: string;
  'Key Findings': string;
  Objectives: string;
  Methods: string;
  Results: string;
  Conclusions: string;
  'Key Concepts': string;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate summary when modal is opened
  useEffect(() => {
    const generateSummary = async () => {
      if (!open) return;
      
      const pdfText = sessionStorage.getItem('pdfText');
      if (!pdfText) {
        setError('No PDF content found. Please upload a PDF document first.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const summaryData = await generateStructuredSummary();
        setSummary(summaryData as Summary);
      } catch (err) {
        console.error('Error generating summary:', err);
        setError('Failed to generate summary. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to generate summary. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    generateSummary();
  }, [open, toast]);

  // Format the content with Markdown-like syntax
  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Handle bullet points
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- ')) {
        return (
          <div key={i} className="flex mb-1">
            <span className="mr-2">•</span>
            <span>{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      return <p key={i} className="mb-3">{trimmedLine}</p>;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Paper Summary</DialogTitle>
          <DialogDescription>
            AI-generated summary of the key points in your document
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Generating summary...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
        ) : summary ? (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="findings">Key Findings</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="conclusions">Conclusions</TabsTrigger>
              <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[350px] mt-4 p-4 border rounded-md">
              <TabsContent value="summary" className="p-2">
                {formatContent(summary.Summary)}
              </TabsContent>
              <TabsContent value="findings" className="p-2">
                {formatContent(summary['Key Findings'])}
              </TabsContent>
              <TabsContent value="objectives" className="p-2">
                {formatContent(summary.Objectives)}
              </TabsContent>
              <TabsContent value="methods" className="p-2">
                {formatContent(summary.Methods)}
              </TabsContent>
              <TabsContent value="results" className="p-2">
                {formatContent(summary.Results)}
              </TabsContent>
              <TabsContent value="conclusions" className="p-2">
                {formatContent(summary.Conclusions)}
              </TabsContent>
              <TabsContent value="concepts" className="p-2">
                {formatContent(summary['Key Concepts'])}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => {
              setIsLoading(true);
              generateStructuredSummary()
                .then(data => {
                  setSummary(data as Summary);
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error('Error regenerating summary:', err);
                  setError('Failed to regenerate summary. Please try again.');
                  setIsLoading(false);
                });
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating
              </>
            ) : (
              'Regenerate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
