
import React, { useState, useEffect } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import MarkMapViewer from "@/components/mindmap/MarkMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { useMobileView } from "@/hooks/use-mobile";
import { MindElixirInstance } from "mind-elixir";
import { retrievePDF } from "@/utils/pdfStorage";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (mindMap: MindElixirInstance) => void;
  explainText: string;
  onExplainText: (text: string) => void;
  isMarkMapActive: boolean;
}

const PanelStructure: React.FC<PanelStructureProps> = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
  isMarkMapActive
}) => {
  const isMobile = useMobileView();
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  
  // Load PDF data when component mounts
  useEffect(() => {
    const loadPdfData = async () => {
      const data = await retrievePDF();
      setPdfData(data || null);
    };
    
    loadPdfData();
  }, []);
  
  // Handle mind map initialization
  const handleMindMapReady = (mindMap: MindElixirInstance) => {
    setMindMap(mindMap);
    if (onMindMapReady) {
      onMindMapReady(mindMap);
    }
  };
  
  // Determine layout based on visible panels
  const numPanels = (showPdf ? 1 : 0) + (showChat ? 1 : 0) + 1; // Always show the mindmap
  
  return (
    <div className="flex h-full overflow-hidden">
      {/* PDF Panel */}
      {showPdf && (
        <div className={`${numPanels === 3 ? 'w-1/3' : numPanels === 2 ? 'w-1/2' : 'w-full'} h-full border-r`}>
          {pdfData ? (
            <PdfViewer 
              onExplainText={onExplainText}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No PDF loaded</p>
            </div>
          )}
        </div>
      )}
      
      {/* Mind Map Panel */}
      <div className={`${numPanels === 3 ? 'w-1/3' : numPanels === 2 ? 'w-1/2' : 'w-full'} h-full relative`}>
        {isMarkMapActive ? (
          <MarkMapViewer mindMap={mindMap} />
        ) : (
          <MindMapViewer 
            isMapGenerated={true} 
            onMindMapReady={handleMindMapReady}
            onExplainText={onExplainText}
            onRequestOpenChat={toggleChat}
          />
        )}
      </div>
      
      {/* Chat Panel - Desktop */}
      {!isMobile && showChat && (
        <div className={`${numPanels === 3 ? 'w-1/3' : numPanels === 2 ? 'w-1/2' : 'w-full'} h-full border-l`}>
          <ChatPanel 
            explainText={explainText} 
            toggleChat={toggleChat}
          />
        </div>
      )}
      
      {/* Mobile Chat Sheet */}
      {isMobile && (
        <MobileChatSheet 
          explainText={explainText}
          onScrollToPdfPosition={() => {}}
        />
      )}
    </div>
  );
};

export default PanelStructure;
