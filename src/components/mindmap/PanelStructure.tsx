import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/ChatPanel";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
}: PanelStructureProps) => {
  const isMapGenerated = true;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* PDF Panel */}
      {showPdf && (
        <div className="pdf-panel h-full transition-width duration-300 ease-in-out overflow-hidden">
          <PdfViewer togglePdf={togglePdf} />
        </div>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <div className="flex-1 h-full overflow-hidden">
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
        />
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 h-full border-l border-gray-200 overflow-hidden">
          <ChatPanel
            toggleChat={toggleChat}
            explainText={explainText}
            onExplainText={onExplainText}
          />
        </div>
      )}
    </div>
  );
};

export default PanelStructure;
