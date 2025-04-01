
import { useRef } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";

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
  const pdfViewerRef = useRef(null);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      {/* PDF Panel */}
      {showPdf && (
        <>
          <ResizablePanel defaultSize={30} minSize={15} maxSize={50} className="h-full">
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <ResizablePanel defaultSize={showChat ? 50 : 70} className="h-full">
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
        />
      </ResizablePanel>

      {/* Chat Panel */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40} className="h-full">
            <ChatPanel
              toggleChat={toggleChat}
              explainText={explainText}
              onExplainText={onExplainText}
              onScrollToPdfPosition={(position) => {
                if (pdfViewerRef.current) {
                  // @ts-ignore - we know this method exists
                  pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
                }
              }}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
