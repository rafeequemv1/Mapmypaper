
import React from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { downloadMindMapAsPNG, downloadMindMapAsSVG, downloadMindMapAsJSON } from "@/lib/export-utils";
import SnapshotButton from "./SnapshotButton";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  enableSnapshotMode?: () => void; // Added prop for snapshot mode
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  isPdfActive, 
  isChatActive, 
  mindMap,
  enableSnapshotMode // New prop
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
      />
      
      {/* Render the SnapshotButton separately with only the props it needs */}
      {enableSnapshotMode && (
        <div className="absolute top-4 right-4 z-10">
          <SnapshotButton enableSnapshotMode={enableSnapshotMode} />
        </div>
      )}
    </>
  );
};

export default Header;
