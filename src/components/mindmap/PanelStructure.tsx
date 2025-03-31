
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
  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="flex-1 h-full overflow-hidden bg-[#F9F7F3]"
    >
      {/* PDF Viewer Panel */}
      {showPdf && (
        <>
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            className="h-full overflow-hidden bg-white"
          >
            <PdfViewer 
              onRequestOpenChat={() => {
                if (!showChat) toggleChat();
              }} 
              onTogglePdf={togglePdf}
              onExplainText={onExplainText} 
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Mind Map Viewer Panel */}
      <ResizablePanel 
        defaultSize={showChat ? (showPdf ? 40 : 70) : 100} 
        className="h-full overflow-hidden"
      >
        <MindMapViewer 
          isMapGenerated={true} 
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
          onRequestOpenChat={() => {
            if (!showChat) toggleChat();
          }}
        />
      </ResizablePanel>

      {/* Chat Panel */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            className="h-full bg-white"
          >
            <ChatPanel 
              toggleChat={toggleChat} 
              explainText={explainText}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
