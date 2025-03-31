
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Check, FileDown, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStructuredSummary } from "@/services/geminiService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [downloading, setDownloading] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate summary when modal is opened
  useEffect(() => {
    if (open && !summaryData && !loading) {
      generateSummary();
    }
  }, [open]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await generateStructuredSummary();
      setSummaryData(data);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
      toast({
        title: "Summary Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate summary",
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

  // Function to download as PDF
  const downloadAsPDF = async () => {
    if (!summaryRef.current || !summaryData) return;
    
    setDownloading(true);
    
    try {
      const contentElement = summaryRef.current;
      
      // Create a PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Create a canvas from the content
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate dimensions for PDF
      const imgWidth = 210; // A4 width in mm (portrait)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save('document-summary.pdf');
      
      toast({
        title: "Summary Downloaded",
        description: "The summary has been downloaded as a PDF file.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Download Failed",
        description: "There was an error creating the PDF file.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  // Helper function to safely format text with bullet points and paragraphs
  const formatText = (text: string | null | undefined): string => {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Replace bullet points
    let formatted = text.replace(/•/g, '&bull;');
    
    // Convert newlines to <br> tags
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Format bullet points with proper indentation
    formatted = formatted.replace(/- /g, '&bull; ');
    
    return formatted;
  };

  const renderSummarySection = (title: string, content: string | null | undefined) => {
    // Skip rendering if content is undefined, null, or empty
    if (!content) {
      return null;
    }
    
    return (
      <div className="relative group mb-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(content, title)}
          >
            {copiedSection === title ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle>Document Summary</DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>AI-generated structured summary of the document</span>
            <div className="flex gap-2">
              {summaryData && !loading && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2" 
                    onClick={downloadAsPDF}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    <span>Download as PDF</span>
                  </Button>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Generating summary...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={generateSummary}>Try Again</Button>
          </div>
        ) : summaryData ? (
          <ScrollArea className="flex-1">
            <div ref={summaryRef} className="p-4 bg-white">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-center mb-6">Structured Summary</h2>
                
                {/* Summary - always visible as the main section */}
                {summaryData.Summary && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Summary</h3>
                    <p className="text-base" dangerouslySetInnerHTML={{ __html: formatText(summaryData.Summary) }} />
                  </div>
                )}
                
                {/* Key Findings */}
                {summaryData["Key Findings"] && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Key Findings</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData["Key Findings"]) }} />
                  </div>
                )}
                
                {/* Objectives */}
                {summaryData.Objectives && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Objectives</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData.Objectives) }} />
                  </div>
                )}
                
                {/* Methods */}
                {summaryData.Methods && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Methods</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData.Methods) }} />
                  </div>
                )}
                
                {/* Results */}
                {summaryData.Results && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Results</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData.Results) }} />
                  </div>
                )}
                
                {/* Conclusions */}
                {summaryData.Conclusions && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Conclusions</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData.Conclusions) }} />
                  </div>
                )}
                
                {/* Key Concepts */}
                {summaryData["Key Concepts"] && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2 text-primary border-b pb-2">Key Concepts</h3>
                    <div dangerouslySetInnerHTML={{ __html: formatText(summaryData["Key Concepts"]) }} />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
