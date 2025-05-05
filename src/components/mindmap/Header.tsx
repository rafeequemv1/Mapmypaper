
import React from "react";
import HeaderSidebar from "@/components/mindmap/HeaderSidebar";
import { MindElixirInstance } from 'mind-elixir';
import { downloadMindMapAsSVG, downloadMindMapAsPNG } from '@/lib/export-utils';

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
      downloadMindMapAsSVG(mindMap);
    }
  };

  const handleExportPNG = () => {
    if (mindMap) {
      downloadMindMapAsPNG(mindMap);
    }
  };

  const handleExportJSON = () => {
    if (mindMap) {
      const data = mindMap.getData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mindmap-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
