
import { useState, useEffect, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import PdfViewer from "../PdfViewer";
import ChatPanel from "./ChatPanel";
import MindMapPanel from "./MindMapPanel";
import { MindElixirInstance } from "mind-elixir";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  onMindMapReady: (instance: MindElixirInstance) => void;
  explainText?: string;
  onExplainText: (text: string) => void;
  pdfKey?: string | null;
  hasExtractedImages?: boolean;
}

const PanelStructure = ({ 
  showPdf, 
  showChat, 
  togglePdf, 
  toggleChat, 
  onMindMapReady,
  explainText,
  onExplainText,
  pdfKey,
  hasExtractedImages = false
}: PanelStructureProps) => {
  const [pdfViewerRef, setPdfViewerRef] = useState<any>(null);
  const [showPdfSidebar, setShowPdfSidebar] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedTextFromPdf, setSelectedTextFromPdf] = useState<string>('');
  
  // When explainText is provided from parent, update local state
  useEffect(() => {
    if (explainText) {
      setSelectedTextFromPdf(explainText);
    }
  }, [explainText]);
  
  const handleTextSelected = useCallback((text: string) => {
    setSelectedTextFromPdf(text);
    onExplainText(text);
  }, [onExplainText]);
  
  const handleImageCaptured = useCallback((imageData: string) => {
    setCapturedImage(imageData);
    // Open chat panel if not already open when image is captured
    if (!showChat) {
      toggleChat();
    }
  }, [showChat, toggleChat]);

  // Calculate min sizes and default sizes for the panels
  const getDefaultSizes = () => {
    if (showPdf && showChat) {
      return [20, 50, 30]; // PDF, MindMap, Chat
    } else if (showPdf) {
      return [25, 75]; // PDF, MindMap
    } else if (showChat) {
      return [70, 30]; // MindMap, Chat
    }
    return [100]; // MindMap only
  };

  // Handle sizes to match visible panels
  const getVisiblePanels = () => {
    if (showPdf && showChat) {
      return 3;
    } else if (showPdf || showChat) {
      return 2;
    }
    return 1;
  };
  
  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup 
        direction="horizontal"
        className="min-h-0 h-full"
      >
        {/* PDF Panel */}
        {showPdf && (
          <>
            <ResizablePanel 
              defaultSize={getDefaultSizes()[0]} 
              minSize={15}
              className="min-h-0"
            >
              <div className="h-full">
                <PdfViewer 
                  ref={setPdfViewerRef}
                  onTextSelected={handleTextSelected}
                  onImageCaptured={handleImageCaptured}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        
        {/* MindMap Panel */}
        <ResizablePanel 
          defaultSize={getDefaultSizes()[showPdf ? 1 : 0]} 
          minSize={30}
          className="min-h-0 flex flex-col"
        >
          <MindMapPanel
            onMindMapReady={onMindMapReady}
            pdfKey={pdfKey}
            hasExtractedImages={hasExtractedImages}
          />
        </ResizablePanel>
        
        {/* Chat Panel */}
        {showChat && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={getDefaultSizes()[getVisiblePanels() - 1]} 
              minSize={20}
              className="min-h-0"
            >
              <ChatPanel
                initialText={selectedTextFromPdf}
                capturedImage={capturedImage}
                onClearCapturedImage={() => setCapturedImage(null)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default PanelStructure;
