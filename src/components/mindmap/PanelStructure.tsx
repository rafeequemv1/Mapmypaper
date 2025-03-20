import React from 'react';
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "@/components/ChatPanel";
import { MindMapTheme } from "@/components/mindmap/ThemeSelect";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady?: (mindMap: any) => void;
  theme?: MindMapTheme;
}

const PanelStructure: React.FC<PanelStructureProps> = ({ 
  showPdf, 
  showChat, 
  toggleChat, 
  togglePdf, 
  onMindMapReady,
  theme
}) => {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* PDF Viewer Panel */}
      {showPdf && (
        <div className="w-1/3 h-full border-r border-gray-200 overflow-hidden">
          <PdfViewer />
        </div>
      )}

      {/* Mind Map Viewer Panel */}
      <div className={`flex-1 h-full overflow-hidden ${showPdf ? 'border-r border-gray-200' : ''}`}>
        <MindMapViewer isMapGenerated={true} onMindMapReady={onMindMapReady} theme={theme} />
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-1/4 h-full border-l border-gray-200">
          <ChatPanel toggleChat={toggleChat} />
        </div>
      )}
    </div>
  );
};

export default PanelStructure;
