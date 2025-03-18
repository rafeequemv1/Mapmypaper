
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Check, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStructuredSummary } from "@/services/gemini/summaryService";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SummaryData {
  [key: string]: string;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const { toast } = useToast();
  const [progress, setProgress] = useState(20);

  // Check for PDF data when modal is opened
  useEffect(() => {
    if (open) {
      checkPdfAvailability();
    }
  }, [open]);

  // Check if PDF data is available
  const checkPdfAvailability = () => {
    try {
      // Check both possible storage keys for PDF data
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      const hasPdf = !!pdfData && pdfData.length > 100;
      
      console.log("PDF availability check:", hasPdf, "PDF data length:", pdfData ? pdfData.length : 0);
      
      // Update state based on PDF availability
      setPdfAvailable(hasPdf);
      
      // If PDF is available and we don't have summary data or an error, generate summary
      if (hasPdf && !summaryData && !loading && !error) {
        generateSummary();
      } else if (!hasPdf) {
        setError("No PDF data found. Please upload a PDF document first.");
      }
    } catch (e) {
      console.error("Error checking PDF availability:", e);
      setPdfAvailable(false);
      setError("Error checking PDF availability. Please try again.");
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      // Don't reset summaryData so it persists between modal opens
      setError(null);
      setProgress(20);
    }
  }, [open]);
  
  // Simulate progress during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(20);
      interval = setInterval(() => {
        setProgress(prev => {
          // Don't go beyond 90% until we actually get results
          const next = prev + 5;
          return next > 90 ? 90 : next;
        });
      }, 1000);
    } else {
      setProgress(100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Analyzing document",
        description: "Generating a comprehensive summary...",
      });
      
      console.log("Beginning summary generation process");
      
      // Check if PDF data exists
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      if (!pdfData) {
        throw new Error("No PDF data found. Please upload a PDF document first.");
      }
      
      console.log("PDF data found, length:", pdfData.length);
      
      // Check if pdfText exists, if not try to create a placeholder
      const pdfText = sessionStorage.getItem('pdfText');
      if (!pdfText || pdfText.trim() === '') {
        console.log("No PDF text found, creating placeholder");
        // Create a placeholder text so the service has something to work with
        sessionStorage.setItem('pdfText', 'PDF text extraction in progress. Using document data for analysis.');
      }

      // Set a timeout to prevent the UI from hanging if the request takes too long
      const timeoutPromise = new Promise<Record<string, string>>(
        (_, reject) => setTimeout(() => reject(new Error("Summary generation is taking too long. Please try again.")), 45000)
      );

      const summaryPromise = generateStructuredSummary();
      
      const data = await Promise.race([summaryPromise, timeoutPromise]);
      console.log("Summary data received:", Object.keys(data));
      setSummaryData(data);
      
      toast({
        title: "Summary complete",
        description: "Document analysis finished successfully",
      });
    } catch (err) {
      console.error("Error generating summary:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate summary";
      setError(errorMessage);
      
      toast({
        title: "Summary Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      
      toast({
        title: "Copied to clipboard",
        description: `${section} has been copied to clipboard`,
        duration: 2000,
      });
      
      setTimeout(() => {
        setCopiedSection(null);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text:", err);
      
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    });
  };

  const renderSummarySection = (title: string, content: string) => {
    return (
      <div className="relative group mb-5 p-4 bg-muted/10 rounded-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-primary mb-3">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(content, title)}
          >
            {copiedSection === title ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
      </div>
    );
  };

  // Enhanced helper function to format text with bullet points, paragraphs and headings
  const formatText = (text: string): string => {
    if (!text) return "";
    
    // Replace bullet points
    let formatted = text.replace(/•/g, '&bull;');
    
    // Convert markdown-style headings to HTML
    formatted = formatted.replace(/^###\s+(.*?)$/gm, '<h3 class="text-md font-medium mt-3 mb-2">$1</h3>');
    formatted = formatted.replace(/^##\s+(.*?)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
    formatted = formatted.replace(/^#\s+(.*?)$/gm, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>');
    
    // Format bullet points with proper styling
    formatted = formatted.replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4">$1</li>');
    
    // Wrap bullet points in ul tags
    let hasOpenUl = false;
    const lines = formatted.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<li')) {
        if (!hasOpenUl) {
          lines[i] = '<ul class="list-disc pl-4 my-2">' + lines[i];
          hasOpenUl = true;
        }
      } else if (hasOpenUl) {
        lines[i-1] = lines[i-1] + '</ul>';
        hasOpenUl = false;
      }
    }
    
    if (hasOpenUl) {
      lines[lines.length-1] = lines[lines.length-1] + '</ul>';
    }
    
    formatted = lines.join('\n');
    
    // Convert newlines to paragraph breaks
    formatted = formatted.split('\n\n').map(para => {
      if (!para.trim().startsWith('<h') && !para.trim().startsWith('<ul')) {
        return `<p class="mb-2">${para}</p>`;
      }
      return para;
    }).join('');
    
    // Fix any remaining newlines
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  // Function to render loading skeletons
  const renderLoadingSkeletons = () => (
    <div className="space-y-6 p-4">
      <div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-4/6 mb-1" />
        <Skeleton className="h-4 w-3/6" />
      </div>
      <div>
        <Skeleton className="h-6 w-36 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );

  // Render different content based on PDF availability and loading state
  const renderContent = () => {
    if (!pdfAvailable) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
          <Alert variant="destructive">
            <FileText className="h-4 w-4" />
            <AlertTitle>No PDF Document Found</AlertTitle>
            <AlertDescription>
              Please upload a PDF document on the home page before generating a summary.
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.href = "/"} className="mt-4">
            Go to Upload Page
          </Button>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Progress value={progress} className="w-full max-w-md mb-4" />
          <p className="text-sm text-muted-foreground mb-10">Analyzing document and generating summary...</p>
          {renderLoadingSkeletons()}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Summary Generation Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={generateSummary} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }
    
    if (summaryData) {
      return (
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
            <TabsTrigger value="all">All Sections</TabsTrigger>
            <TabsTrigger value="key-points">Key Points</TabsTrigger>
            <TabsTrigger value="methods-results">Methods & Results</TabsTrigger>
            <TabsTrigger value="conclusions">Conclusions</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              <TabsContent value="all" className="mt-0">
                {summaryData.Overview && renderSummarySection("Overview", summaryData.Overview)}
                {summaryData["Key Findings"] && renderSummarySection("Key Findings", summaryData["Key Findings"])}
                {summaryData.Objectives && renderSummarySection("Objectives", summaryData.Objectives)}
                {summaryData.Methods && renderSummarySection("Methods", summaryData.Methods)}
                {summaryData.Results && renderSummarySection("Results", summaryData.Results)}
                {summaryData.Conclusions && renderSummarySection("Conclusions", summaryData.Conclusions)}
              </TabsContent>
              
              <TabsContent value="key-points" className="mt-0">
                {summaryData.Overview && renderSummarySection("Overview", summaryData.Overview)}
                {summaryData["Key Findings"] && renderSummarySection("Key Findings", summaryData["Key Findings"])}
                {summaryData.Objectives && renderSummarySection("Objectives", summaryData.Objectives)}
              </TabsContent>
              
              <TabsContent value="methods-results" className="mt-0">
                {summaryData.Methods && renderSummarySection("Methods", summaryData.Methods)}
                {summaryData.Results && renderSummarySection("Results", summaryData.Results)}
              </TabsContent>
              
              <TabsContent value="conclusions" className="mt-0">
                {summaryData.Conclusions && renderSummarySection("Conclusions", summaryData.Conclusions)}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <p className="text-muted-foreground mb-4">No summary generated yet.</p>
        <Button onClick={generateSummary} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Summary
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Summary</DialogTitle>
          <DialogDescription>
            AI-generated structured summary of the document
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
