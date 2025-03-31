
import { useState, useRef, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "./ChatPanel";
import MobileChatSheet from "./MobileChatSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MindElixirInstance } from "mind-elixir";
import { Slider } from "@/components/ui/slider";

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

  // Panel sizing with independent control
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

  // Handle width adjustments for PDF panel - reverse logic compared to Chat panel
  const handlePdfWidthChange = (value: number) => {
    // Reverse the slider value to match expected behavior: 
    // smaller value = narrower panel
    const reversedValue = 50 - (value - 20); // Value is between 20-50, so reverse within that range
    setPdfPanelSize(reversedValue);
  };
  
  // Handle width adjustments for Chat panel - normal logic
  const handleChatWidthChange = (value: number) => {
    setChatPanelSize(value);
  };

  // Make sure PDF panel size slider shows the inverted value to the user
  const displayPdfSliderValue = 50 - (pdfPanelSize - 20);

  return (
    <div className="h-full flex flex-col">
      {/* Panel Controls for Desktop */}
      {!isMobile && (showPdf || showChat) && (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-4 text-sm">
          {showPdf && (
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-xs font-medium">PDF Width: {displayPdfSliderValue}%</span>
              <Slider 
                value={[displayPdfSliderValue]} 
                onValueChange={(values) => handlePdfWidthChange(values[0])}
                max={50}
                min={20}
                step={5}
                className="w-24"
              />
            </div>
          )}
          
          {showChat && (
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-xs font-medium">Chat Width: {chatPanelSize}%</span>
              <Slider 
                value={[chatPanelSize]} 
                onValueChange={(values) => handleChatWidthChange(values[0])}
                max={50}
                min={20}
                step={5}
                className="w-24"
              />
            </div>
          )}
        </div>
      )}
      
      <ResizablePanelGroup 
        direction="horizontal"
        onLayout={(sizes) => {
          // We still want to keep track of the relative panel sizes when manually resizing
          if (showPdf && showChat) {
            setPdfPanelSize(sizes[0]);
            setMindMapPanelSize(sizes[1]);
            setChatPanelSize(sizes[2]);
          } else if (showPdf) {
            setPdfPanelSize(sizes[0]);
            setMindMapPanelSize(sizes[1]);
          } else if (showChat) {
            setMindMapPanelSize(sizes[0]);
            setChatPanelSize(sizes[1]);
          }
        }}
        className="flex-1"
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
