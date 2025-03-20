
import React, { useState } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      {/* PDF Viewer Panel */}
      {showPdf && (
        <>
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full border-r">
              <PdfViewer className="h-full" onTogglePdf={togglePdf} onExplainText={setTextToExplain} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Mind Map Panel (takes remaining width) */}
      <ResizablePanel defaultSize={showPdf ? 70 : 100} minSize={30}>
        <div className="h-full">
          <MindMapViewer isMapGenerated={true} onMindMapReady={onMindMapReady} />
        </div>
      </ResizablePanel>

      {/* Chat Panel */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-l">
              <ChatPanel toggleChat={toggleChat} explainText={textToExplain} />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
