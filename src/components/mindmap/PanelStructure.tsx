
import { useState, useRef } from "react";
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
  onMindMapReady: (mindMap: MindElixirInstance) => void;
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

  // Panel sizing
  const [pdfPanelSize, setPdfPanelSize] = useState(30);
  const [mindMapPanelSize, setMindMapPanelSize] = useState(40);
  const [chatPanelSize, setChatPanelSize] = useState(30);
  
  // Function to handle citation clicks and scroll PDF to that position
  const handleScrollToPdfPosition = (position: string) => {
    if (!pdfViewerRef.current) return;
    
    console.log("Scrolling to position:", position);
    
    // Parse the position string (could be page number, section name, etc.)
    // Example: "page5" -> Scroll to page 5
    if (position.toLowerCase().startsWith('page')) {
      const pageNumber = parseInt(position.replace(/[^\d]/g, ''), 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        console.log("Scrolling to page:", pageNumber);
        pdfViewerRef.current.scrollToPage(pageNumber);
        
        // Ensure PDF panel is visible on mobile
        if (!showPdf && !isMobile) {
          togglePdf();
        }
      }
    }
  };

  // Handle resizing of panels
  const handleResizeEnd = (sizes: number[]) => {
    if (showPdf && showChat) {
      // All three panels visible
      setPdfPanelSize(sizes[0]);
      setMindMapPanelSize(sizes[1]);
      setChatPanelSize(sizes[2]);
    } else if (showPdf) {
      // PDF and MindMap
      setPdfPanelSize(sizes[0]);
      setMindMapPanelSize(sizes[1]);
    } else if (showChat) {
      // MindMap and Chat
      setMindMapPanelSize(sizes[0]);
      setChatPanelSize(sizes[1]);
    }
    // If only one panel visible, no need to store sizes
  };

  return (
    <div className="h-full">
      <ResizablePanelGroup 
        direction="horizontal"
        onLayout={handleResizeEnd}
        className="h-full"
      >
        {/* Left Panel - PDF Viewer (Conditionally Rendered) */}
        {showPdf && (
          <>
            <ResizablePanel 
              defaultSize={pdfPanelSize} 
              minSize={20}
              id="pdf-panel"
            >
              <PdfViewer 
                onTextSelected={onExplainText} 
                onPdfLoaded={() => setPdfLoaded(true)}
                ref={pdfViewerRef}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Middle Panel - Mind Map */}
        <ResizablePanel 
          defaultSize={mindMapPanelSize} 
          minSize={30}
          id="mindmap-panel"
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
              id="chat-panel"
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
