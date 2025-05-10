
import React from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { downloadMindMapAsPNG, downloadMindMapAsSVG, downloadMindMapAsJSON, downloadMindMapAsPDF } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  toggleSnapshotMode?: () => void;
  isSnapshotModeActive?: boolean;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  isPdfActive, 
  isChatActive, 
  mindMap,
  toggleSnapshotMode,
  isSnapshotModeActive = false
}: HeaderProps) => {
  // Define export menu handlers
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
      downloadMindMapAsJSON(mindMap);
    }
  };
  
  const handleExportPDF = () => {
    if (mindMap) {
      downloadMindMapAsPDF(mindMap);
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
        onExportPDF={handleExportPDF}
        toggleSnapshotMode={toggleSnapshotMode}
        isSnapshotModeActive={isSnapshotModeActive}
      />
    </>
  );
};

export default Header;
