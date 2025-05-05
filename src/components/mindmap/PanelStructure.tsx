import React, { useState, useCallback } from "react";
import PdfViewer from "@/components/mindmap/PdfViewer";
import MindMapViewer from "@/components/mindmap/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import PdfTabs from "@/components/PdfTabs";
import { MindElixirInstance } from "mind-elixir";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  onMindMapReady?: (instance: MindElixirInstance) => void;
  explainText?: string;
  explainImage?: string;
  onExplainText?: (text: string) => void;
  onActivePdfChange?: (pdfKey: string) => void;
  activePdfKey?: string;
}

const PanelStructure = ({ 
  showPdf, 
  showChat, 
  togglePdf, 
  toggleChat, 
  onMindMapReady,
  explainText,
  explainImage,
  onExplainText,
  onActivePdfChange,
  activePdfKey
}: PanelStructureProps) => {
  const [scrollToPdfPosition, setScrollToPdfPosition] = useState<string | null>(null);

  const handleScrollToPdfPosition = useCallback((position: string) => {
    setScrollToPdfPosition(position);
  }, []);

  // Add handler for PDF tab changes
  const handleTabChange = (pdfKey: string) => {
    if (onActivePdfChange) {
      onActivePdfChange(pdfKey);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel (PDF) */}
      {showPdf && (
        <div 
          className={`${showChat ? 'w-full md:w-1/2 lg:w-3/5' : 'w-full'} h-full flex flex-col overflow-hidden border-r`}
        >
          <PdfTabs onTabChange={handleTabChange} />
          <PdfViewer onScrollToPdfPosition={scrollToPdfPosition} />
        </div>
      )}

      {/* Right Panel (Mindmap or Chat) */}
      {showChat ? (
        <ChatPanel 
          toggleChat={toggleChat}
          explainText={explainText}
          explainImage={explainImage}
          onScrollToPdfPosition={scrollToPdfPosition}
          onExplainText={onExplainText}
          activePdfKey={activePdfKey}
        />
      ) : (
        <div className={`${showPdf ? 'hidden md:flex md:w-1/2 lg:w-2/5' : 'w-full'} h-full flex-col`}>
          <MindMapViewer onMindMapReady={onMindMapReady} />
        </div>
      )}

      {/* Mobile chat sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={scrollToPdfPosition}
        explainText={explainText}
        activePdfKey={activePdfKey} 
      />
    </div>
  );
};

export default PanelStructure;
