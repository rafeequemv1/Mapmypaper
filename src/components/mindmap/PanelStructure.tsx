
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

  // Panel sizing with independent control - now using fixed values
  const pdfPanelDefaultSize = 35; // Increased default PDF panel size
  const mindMapPanelDefaultSize = 40;
  const chatPanelDefaultSize = 30;

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
              defaultSize={pdfPanelDefaultSize} 
              minSize={25}
              id="pdf-panel"
              order={1}
              className="w-full"
            >
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
          defaultSize={mindMapPanelDefaultSize} 
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
              defaultSize={chatPanelDefaultSize} 
              minSize={20}
              id="chat-panel"
              order={3}
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
