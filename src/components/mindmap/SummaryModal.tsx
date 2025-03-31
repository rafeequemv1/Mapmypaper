
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Check, Download } from "lucide-react";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const summaryRef = React.useRef<HTMLDivElement>(null);

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

  const downloadSummaryAsPDF = async () => {
    if (!summaryRef.current || !summaryData) return;

    setIsDownloading(true);
    try {
      const summaryElement = summaryRef.current;
      const canvas = await html2canvas(summaryElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Calculate the PDF dimensions
      const imgWidth = 210; // A4 width in mm (210mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Get PDF file name from session storage or use default
      const pdfFileName = sessionStorage.getItem('pdfFileName') || 'document';
      
      // Save the PDF
      pdf.save(`${pdfFileName.replace('.pdf', '')}-summary.pdf`);
      
      toast({
        title: "Summary Downloaded",
        description: "Summary was successfully downloaded as PDF",
      });
    } catch (error) {
      console.error("Error downloading summary:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(content, title)}
          >
            {copiedSection === title ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-white">
        <DialogHeader className="flex justify-between items-start flex-row">
          <div>
            <DialogTitle>Document Summary</DialogTitle>
            <DialogDescription>
              AI-generated structured summary of the document
            </DialogDescription>
          </div>
          {summaryData && !loading && (
            <Button 
              variant="outline" 
              onClick={downloadSummaryAsPDF}
              disabled={isDownloading || !summaryData}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
          )}
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
          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
              <TabsTrigger value="all">All Sections</TabsTrigger>
              <TabsTrigger value="key-points">Key Points</TabsTrigger>
              <TabsTrigger value="methods-results">Methods & Results</TabsTrigger>
              <TabsTrigger value="conclusions">Conclusions</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <div ref={summaryRef} className="p-6 bg-white">
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
