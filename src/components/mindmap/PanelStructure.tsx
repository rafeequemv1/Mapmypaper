
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
  const [selectedImageArea, setSelectedImageArea] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add debugging for image selection process
  useEffect(() => {
    if (selectedImageArea) {
      console.log("PanelStructure: Image area state updated, length:", selectedImageArea.length);
    }
  }, [selectedImageArea]);

  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      // @ts-ignore - we know this method exists
      pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
    }
  };

  const handleAreaSelected = (imageDataUrl: string) => {
    console.log("Area selected in PanelStructure, image length:", imageDataUrl.length);
    
    // Validate the image data before setting state
    if (imageDataUrl && imageDataUrl.startsWith('data:image/') && imageDataUrl.length > 100) {
      setSelectedImageArea(imageDataUrl);
      
      toast({
        title: "Image captured",
        description: "Sending to AI for analysis...",
      });
      
      // Ensure chat panel is open when an area is selected
      if (!showChat) {
        console.log("Opening chat panel for image analysis");
        toggleChat();
      }
    } else {
      console.error("Invalid image data received:", 
        imageDataUrl ? `Length: ${imageDataUrl.length}, Prefix: ${imageDataUrl.substring(0, 20)}...` : "undefined");
      
      toast({
        title: "Image capture failed",
        description: "The selected area could not be processed.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <div className="h-full w-[40%] flex-shrink-0">
          <TooltipProvider>
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
              onAreaSelected={handleAreaSelected}
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
            explainImage={selectedImageArea}
            onExplainText={onExplainText}
            onScrollToPdfPosition={handleScrollToPdfPosition}
          />
        </div>
      )}

      {/* Mobile Chat Sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
        explainImage={selectedImageArea}
      />
    </div>
  );
};

export default PanelStructure;
