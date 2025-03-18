
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

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
}

const PanelStructure = ({ 
  showPdf, 
  showChat,
  toggleChat
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
      {showPdf && (
        <>
          <ResizablePanel defaultSize={25} minSize={20} id="pdf-panel">
            <PdfViewer />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      <ResizablePanel 
        defaultSize={showChat ? 50 : (showPdf ? 75 : 100)} 
        id="mindmap-panel"
      >
        <MindMapViewer isMapGenerated={isMapGenerated} />
      </ResizablePanel>
      
      {/* Chat panel - only rendered when showChat is true */}
      <ChatPanel showChat={showChat} toggleChat={toggleChat} />
      
      {/* Mobile chat sheet - always rendered but only visible on mobile */}
      <MobileChatSheet />
    </ResizablePanelGroup>
  );
};

export default PanelStructure;
