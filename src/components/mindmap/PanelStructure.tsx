import { useRef, useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import MarkMapModal from "@/components/mindmap/MarkMapModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
  const [showMarkMap, setShowMarkMap] = useState(false);
  const isMapGenerated = true;
  const pdfViewerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Ensure components mount safely
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      setIsRendered(false);
    };
  }, []);

  // Listen for openChatWithText event to open chat panel if needed
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      if (!showChat) {
        toggleChat();
      }
    };
    
    window.addEventListener('openChatWithText', handleOpenChat);
    
    return () => {
      window.removeEventListener('openChatWithText', handleOpenChat);
    };
  }, [showChat, toggleChat]);

  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      try {
        // @ts-ignore - we know this method exists
        pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
      } catch (error) {
        console.error("Error scrolling to PDF position:", error);
      }
    }
  };

  if (!isRendered) {
    return <div className="h-full w-full flex justify-center items-center">Loading panels...</div>;
  }

  return (
    <div className="h-full w-full flex pl-12">
      {/* Vertical Toolbar */}
      <div className="fixed left-0 top-0 bottom-0 w-12 bg-white border-r flex flex-col items-center py-4 gap-2 z-10">
        <Button
          variant="ghost"
          onClick={() => setShowMarkMap(true)}
          className="w-9 h-9 p-0"
          title="Open Mind Map"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <div className="h-full w-[40%] flex-shrink-0">
          <TooltipProvider>
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
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
      
      {/* MarkMap Modal */}
      <MarkMapModal 
        open={showMarkMap} 
        onOpenChange={setShowMarkMap}
      />

      {/* Mobile Chat Sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
        explainText={explainText}
      />
    </div>
  );
};

export default PanelStructure;
