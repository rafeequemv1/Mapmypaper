
import React, { useState } from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  setIsSnapshotMode?: (isActive: boolean) => void;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  isPdfActive, 
  isChatActive, 
  mindMap,
  setIsSnapshotMode
}: HeaderProps) => {
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
    <>
      {/* Render HeaderSidebar outside of any hidden container */}
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
        setIsSnapshotMode={setIsSnapshotMode}
      />
    </>
  );
};

export default Header;
