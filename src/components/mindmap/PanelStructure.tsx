
import { useRef, useState } from "react";
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

  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      // @ts-ignore - we know this method exists
      pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
    }
  };

  const handleAreaSelected = (imageDataUrl: string) => {
    console.log("Area selected in PanelStructure, image length:", imageDataUrl.length);
    setSelectedImageArea(imageDataUrl);
    
    toast({
      title: "Image captured",
      description: "Sending to AI for analysis...",
    });
    
    // Ensure chat panel is open when an area is selected
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
