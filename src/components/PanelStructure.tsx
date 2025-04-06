
import { useRef, useState, useEffect } from "react";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { retrievePDF } from "@/utils/pdfStorage";

interface PanelStructureProps {
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  onMindMapReady,
  explainText,
  onExplainText,
}: PanelStructureProps) => {
  const pdfViewerRef = useRef(null);
  const { toast } = useToast();
  const [pdfKey, setPdfKey] = useState(Date.now());
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(true);
  
  // Check for PDF availability when component mounts
  useEffect(() => {
    const checkPdfAvailability = async () => {
      try {
        console.log("Checking for PDF data in storage...");
        setLoadingPdf(true);
        
        // Try to retrieve PDF from IndexedDB (which will also check session storage)
        const pdfData = await retrievePDF();
        
        if (pdfData) {
          console.log("Found PDF data in storage, length:", pdfData.length);
          // Update the key to force component remount
          setPdfKey(Date.now());
          setPdfLoaded(true);
          console.log("PDF refreshed to avoid cache issues");
        } else {
          console.log("No PDF data found in storage");
          toast({
            title: "No PDF Found",
            description: "Please upload a PDF document first",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking PDF availability:", error);
        toast({
          title: "Error Loading PDF",
          description: "There was a problem loading your PDF. Please try uploading it again.",
          variant: "destructive",
        });
      } finally {
        setLoadingPdf(false);
      }
    };
    
    // Run check with a slight delay to ensure storage is checked after navigation
    checkPdfAvailability();
  }, [toast]);
  
  const handlePdfLoaded = () => {
    console.log("PDF loaded successfully");
    setPdfLoaded(true);
  };
  
  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      // @ts-ignore - we know this method exists
      pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* PDF Panel - Fixed to 50% width */}
      <div className="h-full w-1/2 flex-shrink-0">
        <TooltipProvider>
          <PdfViewer 
            key={pdfKey}
            ref={pdfViewerRef}
            onTextSelected={onExplainText}
            onPdfLoaded={handlePdfLoaded}
          />
        </TooltipProvider>
      </div>

      {/* Chat Panel - Fixed to 50% width */}
      <div className="h-full w-1/2 flex-shrink-0">
        <ChatPanel
          explainText={explainText}
          onExplainText={onExplainText}
          onScrollToPdfPosition={handleScrollToPdfPosition}
        />
      </div>

      {/* Mobile Chat Sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
      />
    </div>
  );
};

export default PanelStructure;
