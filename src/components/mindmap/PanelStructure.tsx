
import { useState, useRef, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "./ChatPanel";
import MobileChatSheet from "./MobileChatSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MindElixirInstance } from "mind-elixir";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (mindElixirInstance: MindElixirInstance) => void;
  explainText?: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText
}: PanelStructureProps) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfPanelSize, setPdfPanelSize] = useState(35);
  const [chatPanelSize, setChatPanelSize] = useState(30);
  const pdfViewerRef = useRef<{ scrollToPage: (pageNumber: number) => void } | null>(null);
  const isMobile = useIsMobile();

  // Function to handle citation clicks and scroll PDF to that position
  const handleScrollToPdfPosition = (position: string) => {
    if (!pdfViewerRef.current) return;
    
    console.log("Scrolling to position:", position);
    
    // Parse the position string (could be page number, section name, etc.)
    if (position.toLowerCase().startsWith('page')) {
      const pageNumber = parseInt(position.replace(/[^\d]/g, ''), 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        console.log("Scrolling to page:", pageNumber);
        
        // Ensure PDF panel is visible first - ALWAYS open PDF if closed
        if (!showPdf) {
          togglePdf(); // Always open the PDF panel when citation is clicked
        }
        
        // Use setTimeout to ensure the panel is visible before scrolling
        setTimeout(() => {
          if (pdfViewerRef.current) {
            pdfViewerRef.current.scrollToPage(pageNumber);
          }
        }, 100);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup 
        direction="horizontal"
        className="flex-1"
      >
        {/* Left Panel - PDF Viewer (Conditionally Rendered) */}
        {showPdf && (
          <>
            <ResizablePanel 
              defaultSize={pdfPanelSize} 
              minSize={20}
              maxSize={55}
              id="pdf-panel"
              order={1}
              className="w-full relative"
              onResize={(size) => setPdfPanelSize(size)}
            >
              <PdfViewer 
                onTextSelected={(text) => {
                  // When text is selected, immediately send it to chat
                  if (text) {
                    onExplainText(text);
                    
                    // Open chat panel if not already open
                    if (!showChat) {
                      toggleChat();
                    }
                  }
                }}
                onPdfLoaded={() => setPdfLoaded(true)}
                ref={pdfViewerRef}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Middle Panel - Mind Map */}
        <ResizablePanel 
          defaultSize={showPdf && showChat ? 35 : showPdf || showChat ? 60 : 100}
          minSize={30}
          id="mindmap-panel"
          order={2}
        >
          <MindMapViewer 
            isMapGenerated={true} 
            onMindMapReady={onMindMapReady} 
          />
        </ResizablePanel>

        {/* Right Panel - Chat (Conditionally Rendered) */}
        {showChat && !isMobile && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={chatPanelSize} 
              minSize={20}
              maxSize={50}
              id="chat-panel"
              order={3}
              onResize={(size) => setChatPanelSize(size)}
              className="relative"
            >
              <ChatPanel 
                toggleChat={toggleChat} 
                explainText={explainText}
                onScrollToPdfPosition={handleScrollToPdfPosition} 
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      
      {/* Mobile Chat Sheet */}
      {isMobile && <MobileChatSheet onScrollToPdfPosition={handleScrollToPdfPosition} />}
    </div>
  );
};

export default PanelStructure;
