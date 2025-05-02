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
import { getAllPdfs } from "@/components/PdfTabs";
import { getPdfText } from "@/utils/pdfStorage";

// Define a flexible interface to handle different document types
interface Summary {
  Summary: string;
  [key: string]: string; // Allow for flexible fields based on document type
}

// Default empty summary with just the required Summary field
const emptyMappedSummary: Summary = {
  Summary: "Loading..."
};

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfKey?: string | null;
}

const SummaryModal = ({ open, onOpenChange, pdfKey }: SummaryModalProps) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary>(emptyMappedSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [documentType, setDocumentType] = useState<string>("document");
  const [documentName, setDocumentName] = useState<string>("Document");

  // Set the document name based on the key
  useEffect(() => {
    if (pdfKey) {
      const pdfs = getAllPdfs();
      const currentPdf = pdfs.find(pdf => pdf.name === pdfKey.split('_')[0]);
      if (currentPdf) {
        setDocumentName(currentPdf.name);
      } else {
        setDocumentName("Document");
      }
    } else {
      setDocumentName("Document");
    }
  }, [pdfKey]);

  // Generate summary when the modal is opened
  useEffect(() => {
    if (open) {
      generateSummary();
    }
  }, [open, pdfKey]);

  // Generate summary from PDF
  const generateSummary = async () => {
    if (!pdfKey) {
      toast({
        title: "Error",
        description: "No PDF selected for summary generation",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Get PDF text first
      const pdfText = await getPdfText(pdfKey);
      
      if (!pdfText) {
        throw new Error("Could not extract text from the PDF");
      }
      
      // Then generate the summary by passing the PDF text
      const result = await generateStructuredSummary(pdfText);
      
      // Try to detect the document type from the result keys
      if (result["Key Findings"] && result["Methods"]) {
        setDocumentType("research paper");
      } else if (result["Implementation"] && result["Requirements"]) {
        setDocumentType("technical document");
      } else if (result["Business Context"] && result["Financial Implications"]) {
        setDocumentType("business document");
      } else if (result["Legal Framework"] && result["Parties & Obligations"]) {
        setDocumentType("legal document");
      } else if (result["Main Event"] && result["Key Players"]) {
        setDocumentType("news article");
      } else if (result["Themes"] && result["Characters/Elements"]) {
        setDocumentType("creative work");
      } else if (result["Main Points"] && result["Structure"]) {
        setDocumentType("document");
      }
      
      // Cast the response to Summary type using type assertion
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

  // Helper: sanitize and clean up summary text removing unwanted symbols
  const cleanSummaryText = (text: any): string => {
    if (!text) return "";
    if (Array.isArray(text)) {
      // Join array elements and remove extraneous punctuation and quotes
      return text.join(' ').replace(/[\[\]"']/g, '').replace(/(\s*,\s*)+/g, ' ').trim();
    }
    if (typeof text === "string") {
      return text.replace(/[\[\]"']/g, '').replace(/\s*,\s*/g, ' ').trim();
    }
    return String(text);
  };

  // Helper: parse Summary field into bullet points by splitting sentences
  const getEasySummaryBullets = (text: string): string[] => {
    if (!text) return [];
    // Split by period, question mark, exclamation mark, or newline
    const sentences = text.split(/[\.\!\?\n]+/).map(s => s.trim()).filter(Boolean);
    return sentences;
  };

  // Prepare cleaned summary.Summary to always show easy summary bullets
  const easySummaryText = cleanSummaryText(summary.Summary);
  const easySummaryBullets = getEasySummaryBullets(easySummaryText);

  // Prepare cleaned detailed sections to remove symbol marks before display
  const cleanedSummary = Object.entries(summary).reduce((acc, [key, value]) => {
    acc[key] = cleanSummaryText(value);
    return acc;
  }, {} as Record<string, string>);

  // Get a title based on the detected document type
  const getModalTitle = () => {
    const typeTitle = documentType.charAt(0).toUpperCase() + documentType.slice(1);
    return `${documentName} - ${typeTitle} Summary`;
  };

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
      pdf.text(getModalTitle(), 105, 15, { align: 'center' });

      // Add the captured content
      pdf.addImage(imgData, 'PNG', 0, 25, imgWidth, imgHeight - 25);

      // Generate a filename based on the document name
      const filename = documentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') + '_summary.pdf';
      
      // Save the PDF with appropriate filename
      pdf.save(filename);

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
        <DialogContent 
          className="max-w-[75vw] max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxWidth: '75vw' }} // explicitly reduce width by ~25% from default max-w-4xl (~1120px)
        >
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{getModalTitle()}</span>
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
                Generating comprehensive summary of {documentName}...
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto pr-2">
              <div ref={summaryRef} className="p-4 space-y-6">
                {/* Always show Easy Summary Section */}
                {(easySummaryBullets.length > 0) && (
                  <div className="summary-section">
                    <h3 className="text-lg font-bold border-b pb-1 mb-2">Easy Summary</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {easySummaryBullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Sections */}
                {Object.entries(cleanedSummary).map(([key, value]) => {
                  // Skip Easy Summary as it's separately rendered
                  if (key === "Summary") return null;
                  return (
                    <div key={key} className="summary-section">
                      <h3 className="text-lg font-bold border-b pb-1 mb-2">{key}</h3>
                      <div className="summary-section-content pl-2">
                        {value}
                      </div>
                    </div>
                  );
                })}
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
              This will create a PDF document containing the complete summary of {documentName}.
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
