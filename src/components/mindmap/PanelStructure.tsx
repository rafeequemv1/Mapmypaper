import React, { useState, useCallback, useRef } from "react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/mindmap/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import { useGenerateMindMap } from "@/hooks/use-generate-mind-map";
import { MindElixirInstance } from "mind-elixir";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (instance: MindElixirInstance) => void;
  explainText?: string;
  explainImage?: string;
  onExplainText?: (text: string) => void;
  onExplainImage?: (imageData: string) => void;
}

const PanelStructure: React.FC<PanelStructureProps> = ({ 
  showPdf, 
  showChat, 
  toggleChat, 
  togglePdf, 
  onMindMapReady, 
  explainText,
  explainImage,
  onExplainText,
  onExplainImage
}) => {
  const pdfViewerRef = useRef<any>(null);
  const { isGenerating, handlePdfLoaded, MindMapComponent } = useGenerateMindMap({ onMindMapReady });

  // Define the scrollToPdfPosition handler
  const handleScrollToPdfPosition = useCallback((position: string) => {
    if (pdfViewerRef.current && typeof pdfViewerRef.current.scrollToPage === 'function') {
      // Extract the page number from the citation
      const pageNumber = parseInt(position.replace(/[^\d]/g, ''), 10);
      
      if (!isNaN(pageNumber)) {
        pdfViewerRef.current.scrollToPage(pageNumber);
      } else {
        console.error("Invalid page number in citation:", position);
      }
    } else {
      console.warn("PDF viewer ref not available or scrollToPage function not defined");
    }
  }, [pdfViewerRef]);

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="flex-1 w-full overflow-hidden"
    >
      <ResizablePanel 
        defaultSize={showPdf ? 60 : 0} 
        minSize={20}
        maxSize={80}
        className={`${showPdf ? 'block' : 'hidden'} transition-all duration-300`}
      >
        <PdfViewer
          ref={pdfViewerRef}
          onTextSelected={onExplainText}
          onImageSelected={onExplainImage}
          onPdfLoaded={handlePdfLoaded}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={showPdf ? 40 : 100} minSize={20}>
        <div className="h-full flex flex-col">
          <div className="flex-1 relative bg-white">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <span className="text-lg font-medium text-gray-700">
                  Generating Mind Map...
                </span>
              </div>
            ) : (
              <MindMapViewer MindMapComponent={MindMapComponent} />
            )}
          </div>
          {showChat && (
            <ChatPanel 
              toggleChat={toggleChat} 
              explainText={explainText}
              explainImage={explainImage} 
              onScrollToPdfPosition={handleScrollToPdfPosition}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
