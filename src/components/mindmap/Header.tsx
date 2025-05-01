
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  PanelRight, 
  PanelLeft, 
  FileText, 
  Download,
  Text, 
  GitBranch,
  AlertTriangle
} from "lucide-react";
import HeaderExportMenu from "./HeaderExportMenu";
import HeaderSidebar from "./HeaderSidebar";
import { useToast } from "@/hooks/use-toast";
import { MindElixirInstance } from "mind-elixir";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowMermaid: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  apiStatus?: 'idle' | 'loading' | 'error' | 'success';
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary, 
  setShowMermaid, 
  isPdfActive, 
  isChatActive, 
  mindMap,
  apiStatus = 'idle'
}: HeaderProps) => {
  const { toast } = useToast();
  
  const checkMindMap = (action: () => void) => {
    if (!mindMap) {
      toast({
        title: "No Mind Map Available",
        description: "Please upload a PDF document first to create a mind map.",
        variant: "destructive",
      });
      return;
    }
    action();
  };

  const handleExportClick = () => {
    checkMindMap(() => {
      // The export menu dropdown will handle the actual export options
    });
  };
  
  const handleShowSummary = () => {
    checkMindMap(() => {
      setShowSummary(true);
    });
  };
  
  const handleShowMermaid = () => {
    checkMindMap(() => {
      setShowMermaid(true);
    });
  };

  return (
    <div className="flex justify-between items-center border-b bg-white h-12 z-20">
      <div className="flex items-center space-x-1 pl-12">
        <Button 
          variant={isPdfActive ? "default" : "ghost"}
          size="sm"
          className={isPdfActive ? "" : "text-gray-500"}
          onClick={togglePdf}>
          <FileText className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
        
        <Button 
          variant={isChatActive ? "default" : "ghost"}
          size="sm"
          className={isChatActive ? "" : "text-gray-500"}
          onClick={toggleChat}>
          <PanelRight className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowSummary}
          className="text-gray-500">
          <Text className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Summary</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowMermaid}
          className="text-gray-500">
          <GitBranch className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Flowchart</span>
        </Button>
        
        {apiStatus === 'error' && (
          <div className="ml-2 flex items-center text-red-500">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs">API Error</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <HeaderExportMenu mindMap={mindMap} />
        <HeaderSidebar />
      </div>
    </div>
  );
};

export default Header;
