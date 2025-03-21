
import React from 'react';
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
  // Fixed panel sizes
  const pdfPanelSize = 30;
  const mindMapPanelSize = showPdf ? 40 : 70;
  const chatPanelSize = 30;

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F9F7F3]">
      <div className="w-full h-full flex">
        {/* PDF Viewer Panel */}
        {showPdf && (
          <div className="w-[30%] h-full bg-white">
            <PdfViewer 
              onRequestOpenChat={() => {
                if (!showChat) toggleChat();
              }} 
              onTogglePdf={togglePdf}
              onExplainText={onExplainText} 
            />
          </div>
        )}

        {/* Mind Map Viewer Panel */}
        <div className={`${showPdf ? 'w-[40%]' : 'w-[70%]'} ${showChat ? '' : 'flex-1'} h-full`}>
          <MindMapViewer 
            isMapGenerated={true} 
            onMindMapReady={onMindMapReady}
            onExplainText={onExplainText}
            onRequestOpenChat={() => {
              if (!showChat) toggleChat();
            }}
          />
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-[30%] h-full bg-white">
            <ChatPanel 
              toggleChat={toggleChat} 
              explainText={explainText}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelStructure;
