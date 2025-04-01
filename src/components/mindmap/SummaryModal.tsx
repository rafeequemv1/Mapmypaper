
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Loader2 } from "lucide-react";
import { generateStructuredSummary } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { formatAIResponse, activateCitations } from "@/utils/formatAiResponse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Define the Summary type to match the structure returned by the API
interface Summary {
  Summary: string;
  "Key Findings": string;
  Objectives: string;
  Methods: string;
  Results: string;
  Conclusions: string;
  "Key Concepts": string;
}

// Default empty summary
const emptyMappedSummary: Summary = {
  Summary: "Loading...",
  "Key Findings": "Loading...",
  Objectives: "Loading...",
  Methods: "Loading...",
  Results: "Loading...",
  Conclusions: "Loading...",
  "Key Concepts": "Loading..."
};

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SummaryModal = ({ open, onOpenChange }: SummaryModalProps) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary>(emptyMappedSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Generate summary when the modal is opened
  useEffect(() => {
    if (open) {
      generateSummary();
    }
  }, [open]);

  // Generate summary from PDF
  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const result = await generateStructuredSummary();
      // Cast the response to Summary type
      setSummary(result as unknown as Summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Summary Generation Failed",
        description: "Could not generate a summary from the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle citations click - scroll to PDF page
  const handleCitationClick = (citation: string) => {
    // Extract page number from citation
    const pageMatch = citation.match(/page\s*(\d+)/i);
    if (pageMatch) {
      const pageNumber = parseInt(pageMatch[1], 10);
      // Close the summary modal
      onOpenChange(false);
      
      // Wait for modal to close before scrolling to page
      setTimeout(() => {
        // Create and dispatch a custom event to scroll PDF to the page
        const scrollEvent = new CustomEvent("scrollToPdfPage", { detail: { pageNumber } });
        window.dispatchEvent(scrollEvent);
        
        toast({
          title: "PDF Navigation",
          description: `Scrolling to page ${pageNumber}`,
        });
      }, 300);
    }
  };

  // Process the summary content with citation formatting
  useEffect(() => {
    if (!isLoading && open && summaryRef.current) {
      // Wait a bit to ensure content is rendered
      const timer = setTimeout(() => {
        // Find all sections that might contain citations
        const contentElements = summaryRef.current?.querySelectorAll('.summary-section-content');
        if (contentElements) {
          contentElements.forEach(element => {
            if (element instanceof HTMLElement) {
              // Format AI response - convert markdown and add citations
              let formattedContent = formatAIResponse(element.innerText);
              
              // Convert citation format to small circles with page numbers
              formattedContent = formattedContent.replace(/\[citation:page(\d+)\]/gi, '<span class="citation-circle">$1</span>');
              
              element.innerHTML = formattedContent;
              
              // Activate citations to make them clickable
              const circles = element.querySelectorAll('.citation-circle');
              circles.forEach(circle => {
                if (circle instanceof HTMLElement) {
                  circle.addEventListener('click', () => {
                    const pageNumber = circle.textContent;
                    handleCitationClick(`page${pageNumber}`);
                  });
                }
              });
            }
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, open, summary]);

  // Download summary as PDF
  const downloadSummaryAsPDF = async () => {
    if (!summaryRef.current) return;
    
    setConfirmDownload(false);
    
    try {
      // Show loading toast
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF...",
      });
      
      const element = summaryRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions to match the aspect ratio of the content
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(20);
      pdf.text("Paper Summary", 105, 15, { align: 'center' });
      
      // Add the captured content
      pdf.addImage(imgData, 'PNG', 0, 25, imgWidth, imgHeight - 25);
      
      // Save the PDF
      pdf.save("paper_summary.pdf");
      
      toast({
        title: "PDF Generated",
        description: "Your summary has been downloaded as PDF",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Paper Summary</span>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => setConfirmDownload(true)}
                  className="flex gap-1 text-black"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateSummary}
                  disabled={isLoading}
                  className="flex gap-1 text-black"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Regenerate"
                  )}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                Generating comprehensive summary of the paper...
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto pr-2">
              <div ref={summaryRef} className="p-4 space-y-6">
                {Object.entries(summary).map(([key, value]) => (
                  <div key={key} className="summary-section">
                    <h3 className="text-lg font-bold border-b pb-1 mb-2">{key}</h3>
                    <div className="summary-section-content pl-2">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmDownload} onOpenChange={setConfirmDownload}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Summary as PDF</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a PDF document containing the complete summary of the paper.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={downloadSummaryAsPDF}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SummaryModal;
