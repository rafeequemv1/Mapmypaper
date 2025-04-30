
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import HeaderSidebar from "./HeaderSidebar";
import { MindElixirInstance } from "mind-elixir";
import { exportMapToSVG, exportMapToPNG, exportMapToJSON } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMermaid: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
}

const Header: React.FC<HeaderProps> = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowMermaid,
  isPdfActive,
  isChatActive,
  mindMap 
}) => {
  const navigate = useNavigate();
  
  const handleExportSVG = () => {
    if (mindMap) {
      exportMapToSVG(mindMap);
    }
  };

  const handleExportPNG = () => {
    if (mindMap) {
      exportMapToPNG(mindMap);
    }
  };
  
  const handleExportJSON = () => {
    if (mindMap) {
      exportMapToJSON(mindMap);
    }
  };

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b bg-white z-20 relative">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">Back</span>
        </Button>
      </div>
      <div>
        <h1 className="text-lg font-medium">Mind Map Editor</h1>
      </div>
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="sm"
          disabled={!mindMap}
        >
          <Download className="h-4 w-4" />
          <span className="ml-1">Export</span>
        </Button>
      </div>
      <HeaderSidebar 
        togglePdf={togglePdf}
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        setShowMermaid={setShowMermaid}
        isPdfActive={isPdfActive}
        isChatActive={isChatActive}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
      />
    </div>
  );
};

export default Header;
