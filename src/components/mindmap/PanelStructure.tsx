
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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
}

const PanelStructure = ({ 
  showPdf, 
  showChat,
  toggleChat,
  togglePdf
}: PanelStructureProps) => {
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
          <ResizablePanel defaultSize={25} minSize={20} id="pdf-panel">
            <PdfViewer onTogglePdf={togglePdf} showPdf={showPdf} />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      ) : (
        <div className="absolute top-[60px] left-4 z-10">
          <Button 
            variant="secondary" 
            className="rounded-full h-8 w-8 p-0 shadow-md"
            onClick={togglePdf}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <ResizablePanel 
        defaultSize={showChat ? 50 : (showPdf ? 75 : 100)} 
        id="mindmap-panel"
      >
        <MindMapViewer isMapGenerated={isMapGenerated} />
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
