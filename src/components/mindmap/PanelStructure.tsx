
import { useRef, useState, useEffect } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { retrievePDF } from "@/utils/pdfStorage";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
}: PanelStructureProps) => {
  const isMapGenerated = true;
  const pdfViewerRef = useRef(null);
  const { toast } = useToast();
  const [pdfKey, setPdfKey] = useState(Date.now());
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [explainImage, setExplainImage] = useState<string | null>(null);
  
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
  
  const handleImageSelected = (imageData: string) => {
    console.log("Image area selected in PDF, data length:", imageData.length);
    setExplainImage(imageData);
    
    // Automatically open chat panel when an image is selected for explanation
    if (!showChat) {
      toggleChat();
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <div className="h-full w-[40%] flex-shrink-0">
          <TooltipProvider>
            <PdfViewer 
              key={pdfKey} // Add key to force remount when changed
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
              onImageSelected={handleImageSelected}
              onPdfLoaded={handlePdfLoaded}
            />
          </TooltipProvider>
        </div>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <div className={`h-full ${showPdf ? (showChat ? 'w-[30%]' : 'w-[60%]') : (showChat ? 'w-[70%]' : 'w-full')}`}>
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
        />
      </div>

      {/* Chat Panel - Fixed to 30% width */}
      {showChat && (
        <div className="h-full w-[30%] flex-shrink-0">
          <ChatPanel
            toggleChat={toggleChat}
            explainText={explainText}
            explainImage={explainImage}
            onExplainText={onExplainText}
            onScrollToPdfPosition={handleScrollToPdfPosition}
          />
        </div>
      )}

      {/* Mobile Chat Sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
      />
    </div>
  );
};

export default PanelStructure;
