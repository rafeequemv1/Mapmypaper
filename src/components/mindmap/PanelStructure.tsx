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
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Adjust PDF panel size with constraints
  const adjustPdfPanelSize = (increment: boolean) => {
    setPdfPanelSize(prevSize => {
      const newSize = increment ? prevSize + 5 : prevSize - 5;
      // Keep within reasonable bounds - max 55% of viewport width for PDF
      return Math.max(20, Math.min(55, newSize));
    });
  };

  // Adjust Chat panel size with constraints
  const adjustChatPanelSize = (increment: boolean) => {
    setChatPanelSize(prevSize => {
      const newSize = increment ? prevSize + 5 : prevSize - 5;
      // Keep within reasonable bounds
      return Math.max(20, Math.min(50, newSize));
    });
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
              {/* PDF Size Controls */}
              <div className="absolute top-16 right-3 z-20 flex flex-col gap-1 bg-white/80 rounded-md shadow-md p-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => adjustPdfPanelSize(true)}
                  title="Increase PDF width"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => adjustPdfPanelSize(false)}
                  title="Decrease PDF width"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              
              <TooltipProvider>
                <PdfViewer 
                  onTextSelected={(text) => {
                    // Store selected text but don't send to chat yet
                    // The tooltip button will handle sending text to chat
                    sessionStorage.setItem('selectedPdfText', text || '');
                  }}
                  onPdfLoaded={() => setPdfLoaded(true)}
                  ref={pdfViewerRef}
                  renderTooltipContent={() => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="bg-primary text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                          onClick={() => {
                            const selectedText = sessionStorage.getItem('selectedPdfText');
                            if (selectedText) {
                              onExplainText(selectedText);
                              // Clear the selection after sending to chat
                              sessionStorage.removeItem('selectedPdfText');
                              
                              // Open chat panel if not already open
                              if (!showChat) {
                                toggleChat();
                              }
                            }
                          }}
                        >
                          Explain
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="p-2">
                        <p className="text-xs">Click to explain selected text in chat</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                />
              </TooltipProvider>
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
              {/* Chat Size Controls */}
              <div className="absolute top-16 left-3 z-20 flex flex-col gap-1 bg-white/80 rounded-md shadow-md p-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => adjustChatPanelSize(true)}
                  title="Increase chat width"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => adjustChatPanelSize(false)}
                  title="Decrease chat width"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              
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
