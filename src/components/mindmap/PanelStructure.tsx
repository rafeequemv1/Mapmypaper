
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
  // Calculate panel sizes with increased PDF panel width
  const pdfPanelSize = 40; // Increased from 30% to 40%
  const mindMapPanelSize = showPdf ? 35 : 75; // Adjusted mindmap size
  const chatPanelSize = 25; // Decreased chat panel slightly

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F9F7F3]">
      <div className="w-full h-full flex">
        {/* PDF Viewer Panel */}
        {showPdf && (
          <div className="w-[40%] h-full bg-white flex flex-col"> {/* Increased from 30% to 40% */}
            <PdfViewer 
              className="w-full h-full"
              onRequestOpenChat={() => {
                if (!showChat) toggleChat();
              }} 
              onTogglePdf={togglePdf}
              onExplainText={onExplainText}
              defaultZoom={1.0} // Set default zoom to 100%
            />
          </div>
        )}

        {/* Mind Map Viewer Panel */}
        <div className={`${showPdf ? 'w-[35%]' : 'w-[75%]'} ${showChat ? '' : 'flex-1'} h-full`}> {/* Adjusted from 40% to 35% */}
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
          <div className="w-[25%] h-full bg-white"> {/* Reduced from 30% to 25% */}
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
