
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me questions about the document you uploaded.' }
  ]);
  
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

  // Handle text explanation request
  const handleExplainText = useCallback((text: string) => {
    // Add user message with the text to explain
    const userMessage = `Explain this text: "${text}"`;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show chat panel if not already visible
    if (!showChat) {
      toggleChat();
    }
  }, [showChat, toggleChat]);

  // Define panel sizes for better control
  const pdfPanelSize = 30;
  const mindMapPanelSize = showPdf ? (showChat ? 40 : 70) : (showChat ? 75 : 100);
  const chatPanelSize = 30;

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* PDF panel - left side */}
      {showPdf && (
        <>
          <ResizablePanel 
            defaultSize={pdfPanelSize} 
            minSize={20} 
            maxSize={50}
            id="pdf-panel"
            order={1}
          >
            <PdfViewer 
              onTogglePdf={togglePdf} 
              showPdf={showPdf} 
              onExplainText={handleExplainText}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      
      {/* MindMap panel - center */}
      <ResizablePanel 
        defaultSize={mindMapPanelSize} 
        minSize={30}
        order={2}
        id="mindmap-panel"
      >
        <MindMapViewer 
          isMapGenerated={isMapGenerated} 
          onMindMapReady={onMindMapReady}
        />
      </ResizablePanel>
      
      {/* Chat panel - right side */}
      {showChat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel 
            defaultSize={chatPanelSize} 
            minSize={20} 
            maxSize={50}
            order={3}
            id="chat-panel"
          >
            <ChatPanel 
              toggleChat={toggleChat} 
              initialMessages={chatMessages}
              onMessagesChange={setChatMessages}
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
