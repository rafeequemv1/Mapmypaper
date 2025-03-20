
import React from 'react';
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady?: (mindMap: any) => void;
  explainText?: string;
  onExplainText?: (text: string) => void;
}

const PanelStructure: React.FC<PanelStructureProps> = ({ 
  showPdf, 
  showChat, 
  toggleChat, 
  togglePdf, 
  onMindMapReady,
  explainText,
  onExplainText
}) => {
  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F9F7F3]">
      {/* PDF Viewer Panel */}
      {showPdf && (
        <div className="w-1/3 h-full border-r border-gray-200 overflow-hidden bg-white">
          <PdfViewer 
            onRequestOpenChat={toggleChat} 
            onTogglePdf={togglePdf}
            onExplainText={onExplainText} 
          />
        </div>
      )}

      {/* Mind Map Viewer Panel */}
      <div className={`flex-1 h-full overflow-hidden ${showPdf ? 'border-r border-gray-200' : ''}`}>
        <MindMapViewer isMapGenerated={true} onMindMapReady={onMindMapReady} />
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-1/4 h-full border-l border-gray-200 bg-white">
          <ChatPanel 
            toggleChat={toggleChat} 
            explainText={explainText}
          />
        </div>
      )}
    </div>
  );
};

export default PanelStructure;
