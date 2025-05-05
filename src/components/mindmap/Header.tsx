
import React from "react";
import HeaderSidebar from "@/components/mindmap/HeaderSidebar";
import { MindElixirInstance } from 'mind-elixir';
import { exportSvg, exportPng, exportData } from '@/lib/export-utils';

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
  mindMap,
}) => {
  const handleExportSVG = () => {
    if (mindMap) {
      exportSvg(mindMap);
    }
  };

  const handleExportPNG = () => {
    if (mindMap) {
      exportPng(mindMap);
    }
  };

  const handleExportJSON = () => {
    if (mindMap) {
      exportData(mindMap);
    }
  };

  return (
    <HeaderSidebar
      isPdfActive={isPdfActive}
      isChatActive={isChatActive}
      togglePdf={togglePdf}
      toggleChat={toggleChat}
      setShowSummary={setShowSummary}
      setShowMermaid={setShowMermaid}
      onExportSVG={handleExportSVG}
      onExportPNG={handleExportPNG}
      onExportJSON={handleExportJSON}
    />
  );
};

export default Header;
