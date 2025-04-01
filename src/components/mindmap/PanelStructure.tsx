
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
      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <>
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50} className="h-full" collapsible={false}>
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <ResizablePanel 
        defaultSize={showPdf && showChat ? 30 : (showPdf || showChat ? 60 : 100)} 
        className="h-full" 
        collapsible={false}
      >
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
        />
      </ResizablePanel>

      {/* Chat Panel - Fixed to 30% width */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40} className="h-full" collapsible={false}>
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
