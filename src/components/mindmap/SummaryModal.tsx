
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateStructuredSummary } from "@/services/geminiService";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const [summary, setSummary] = useState<string>("Generating summary...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("summary");
  
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      
      generateStructuredSummary()
        .then(summaryText => {
          setSummary(summaryText);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error generating summary:", err);
          setError("Failed to generate summary. Please try again.");
          setLoading(false);
        });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Summary</DialogTitle>
          <DialogDescription>
            AI-generated summary of the current document.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="summary">Structured Summary</TabsTrigger>
            <TabsTrigger value="raw">Full Text</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="flex-1 mt-2 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4">Generating summary...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                {error}
                <Button 
                  onClick={() => onOpenChange(false)} 
                  className="mt-4 w-full"
                >
                  Close
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="prose max-w-none" 
                     dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }} 
                />
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="raw" className="flex-1 mt-2">
            <ScrollArea className="h-full pr-4">
              <pre className="text-sm whitespace-pre-wrap">{summary}</pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
