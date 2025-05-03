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

  // We're removing the top bar and only keeping the sidebar
  return (
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
  );
};

export default Header;
