
import { useState, useEffect, useCallback } from "react";
import { 
  ResizablePanelGroup, 
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
import ChatPanel from "./ChatPanel";
import MobileChatSheet from "./MobileChatSheet";
import { useToast } from "@/hooks/use-toast";
import { MindElixirInstance } from "mind-elixir";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
}

const PanelStructure = ({ 
  showPdf, 
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady
}: PanelStructureProps) => {
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  
  useEffect(() => {
    // Set a small delay before generating the map to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMapGenerated(true);
      
      // Show toast when mind map is ready
      toast({
        title: "Mindmap loaded",
        description: "Your mindmap is ready to use. Right-click on nodes for options.",
        position: "bottom-left"
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {showPdf ? (
        <>
          <ResizablePanel defaultSize={30} minSize={20} id="pdf-panel">
            <PdfViewer onTogglePdf={togglePdf} showPdf={showPdf} />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      ) : null}
      
      <ResizablePanel 
        defaultSize={showChat ? 45 : (showPdf ? 70 : 100)} 
        id="mindmap-panel"
      >
        <MindMapViewer 
          isMapGenerated={isMapGenerated} 
          onMindMapReady={onMindMapReady}
        />
      </ResizablePanel>
      
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20} id="chat-panel">
            <ChatPanel toggleChat={toggleChat} />
          </ResizablePanel>
        </>
      )}
      
      {/* Mobile chat sheet - always rendered but only visible on mobile */}
      <MobileChatSheet />
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
