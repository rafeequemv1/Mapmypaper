
import { useState, useEffect } from "react";
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
  const [textToExplain, setTextToExplain] = useState("");
  
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

  // Handler for text selected in PDF viewer
  const handleExplainText = (text: string) => {
    setTextToExplain(text);
  };

  // Handler to ensure chat is open when explain is clicked
  const handleRequestOpenChat = () => {
    if (!showChat) {
      toggleChat();
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {showPdf && (
        <>
          <ResizablePanel 
            defaultSize={30} 
            minSize={20} 
            id="pdf-panel"
            order={1}
          >
            <PdfViewer 
              onTogglePdf={togglePdf} 
              showPdf={showPdf} 
              onExplainText={handleExplainText}
              onRequestOpenChat={handleRequestOpenChat}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      
      <ResizablePanel 
        defaultSize={showChat ? 45 : (showPdf ? 70 : 100)} 
        id="mindmap-panel"
        order={2}
      >
        <MindMapViewer 
          isMapGenerated={isMapGenerated} 
          onMindMapReady={onMindMapReady}
        />
      </ResizablePanel>
      
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel 
            defaultSize={25} 
            minSize={20} 
            id="chat-panel"
            order={3}
          >
            <ChatPanel 
              toggleChat={toggleChat} 
              explainText={textToExplain}
            />
          </ResizablePanel>
        </>
      )}
      
      {/* Mobile chat sheet - always rendered but only visible on mobile */}
      <MobileChatSheet />
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
