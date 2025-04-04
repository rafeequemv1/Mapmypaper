
import { useRef, useState, useEffect } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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
  
  // Force refresh PDF component when the component mounts to avoid caching issues
  useEffect(() => {
    // Clear PDF data cache from sessionStorage to ensure fresh loading
    const refreshPdf = () => {
      try {
        // Store the existing PDF data
        const existingPdfData = sessionStorage.getItem("pdfData") || 
                               sessionStorage.getItem("uploadedPdfData");
        
        if (existingPdfData) {
          // Clear and reset with the timestamp to force refresh
          sessionStorage.removeItem("pdfData");
          sessionStorage.setItem("pdfData", existingPdfData);
          
          // Update the key to force component remount
          setPdfKey(Date.now());
          setPdfLoaded(true);
          
          console.log("PDF refreshed to avoid cache issues");
        } else {
          console.log("No PDF data found in storage");
        }
      } catch (error) {
        console.error("Error refreshing PDF:", error);
      }
    };
    
    // Run refresh on component mount
    refreshPdf();
  }, []);
  
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
      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <div className="h-full w-[40%] flex-shrink-0">
          <TooltipProvider>
            <PdfViewer 
              key={pdfKey} // Add key to force remount when changed
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
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
