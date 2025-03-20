
import React, { useState } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (mindMap: any) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
}: PanelStructureProps) => {
  const [textToExplain, setTextToExplain] = useState("");

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* PDF Viewer Panel */}
      {showPdf && (
        <div className="w-1/3 h-full border-r">
          <PdfViewer className="h-full" onTogglePdf={togglePdf} onExplainText={setTextToExplain} />
        </div>
      )}

      {/* Mind Map Panel (takes remaining width) */}
      <div className="flex-1 h-full">
        <MindMapViewer isMapGenerated={true} onMindMapReady={onMindMapReady} />
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-1/4 h-full">
          <ChatPanel toggleChat={toggleChat} explainText={textToExplain} />
        </div>
      )}
    </div>
  );
};

export default PanelStructure;
