
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
  
  // Enhanced debugging for image selection process
  useEffect(() => {
    if (selectedImageArea) {
      console.log("PanelStructure: Image area state updated", {
        length: selectedImageArea.length,
        isDataUrl: selectedImageArea.startsWith('data:image/'),
        preview: selectedImageArea.substring(0, 50) + '...'
      });
    }
  }, [selectedImageArea]);

  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      // @ts-ignore - we know this method exists
      pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
    }
  };

  const handleAreaSelected = (imageDataUrl: string) => {
    console.log("PanelStructure: Area selected received", {
      received: !!imageDataUrl,
      length: imageDataUrl?.length || 0,
      isDataUrl: imageDataUrl?.startsWith('data:image/'),
      preview: imageDataUrl ? imageDataUrl.substring(0, 50) + '...' : 'none'
    });
    
    // Validate the image data before setting state
    if (imageDataUrl && imageDataUrl.startsWith('data:image/') && imageDataUrl.length > 100) {
      setSelectedImageArea(imageDataUrl);
      
      toast({
        title: "Image captured",
        description: "Sending to AI for analysis...",
      });
      
      // Force chat panel to open when an area is selected
      if (!showChat) {
        console.log("Opening chat panel for image analysis");
        toggleChat();
      }
      
      // Small delay to ensure state is updated properly
      setTimeout(() => {
        // Double check if image data is still available after state update
        console.log("Image data verification after state update:", {
          inState: !!selectedImageArea,
          justSet: !!imageDataUrl,
          chatIsOpen: showChat
        });
      }, 100);
    } else {
      console.error("Invalid image data received:", {
        length: imageDataUrl?.length || 0,
        prefix: imageDataUrl ? imageDataUrl.substring(0, 20) + '...' : 'undefined'
      });
      
      toast({
        title: "Image capture failed",
        description: "The selected area could not be processed. Please try again.",
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
