
import { useState, useRef, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "./ChatPanel";
import MobileChatSheet from "./MobileChatSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MindElixirInstance } from "mind-elixir";

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
        {/* Left Panel - PDF Viewer (Conditionally Rendered) with fixed 40% width */}
        {showPdf && (
          <>
            <ResizablePanel 
              defaultSize={40} 
              minSize={40}
              maxSize={40}
              id="pdf-panel"
              order={1}
              className="w-full relative"
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
          defaultSize={showPdf && showChat ? 30 : showPdf || showChat ? 70 : 100}
          minSize={30}
          id="mindmap-panel"
          order={2}
        >
          <MindMapViewer 
            isMapGenerated={true} 
            onMindMapReady={onMindMapReady} 
          />
        </ResizablePanel>

        {/* Right Panel - Chat (Conditionally Rendered) with fixed 30% width */}
        {showChat && !isMobile && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={30} 
              minSize={30}
              maxSize={30}
              id="chat-panel"
              order={3}
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
