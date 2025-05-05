
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import HeaderSidebarIcon from "./HeaderSidebarIcon";
import HeaderExportMenu from "./HeaderExportMenu";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GitMerge, MessageCircle, FileText } from "lucide-react";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  isPdfActive, 
  isChatActive, 
  mindMap 
}: HeaderProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define export menu handlers
  const handleExportSVG = () => {
    if (mindMap) {
      mindMap.exportSvg();
    }
  };

  const handleExportPNG = () => {
    if (mindMap) {
      mindMap.exportPng();
    }
  };

  const handleExportJSON = () => {
    if (mindMap) {
      const data = mindMap.getData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindmap.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="h-14 min-h-14 flex items-center justify-between bg-gray-100 border-b border-gray-200 px-4">
      <div className="flex items-center space-x-4">
        <HeaderSidebar 
          isPdfActive={isPdfActive}
          isChatActive={isChatActive}
          togglePdf={togglePdf}
          toggleChat={toggleChat}
          setShowSummary={setShowSummary}
          setShowFlowchart={setShowFlowchart}
          onExportSVG={handleExportSVG}
          onExportPNG={handleExportPNG}
          onExportJSON={handleExportJSON}
        />
        <div className="text-xl font-semibold hidden md:block">PaperMindMap</div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={isPdfActive ? "default" : "outline"}
          className="flex items-center gap-1 px-2 sm:px-3"
          onClick={togglePdf}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
        
        <Button
          size="sm"
          variant={isChatActive ? "default" : "outline"}
          className="flex items-center gap-1 px-2 sm:px-3"
          onClick={toggleChat}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1 px-2 sm:px-3"
          onClick={() => setShowSummary(true)}
        >
          <GitMerge className="h-4 w-4" />
          <span className="hidden sm:inline">Summary</span>
        </Button>
        
        <HeaderExportMenu 
          onExportSVG={handleExportSVG}
          onExportPNG={handleExportPNG}
          onExportJSON={handleExportJSON}
        />
      </div>
    </div>
  );
};

export default Header;
