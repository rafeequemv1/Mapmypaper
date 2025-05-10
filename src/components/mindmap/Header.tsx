
import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderSidebar from "./HeaderSidebar";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: any;
}

const Header = ({
  togglePdf,
  toggleChat,
  setShowSummary,
  setShowFlowchart,
  isPdfActive,
  isChatActive,
  mindMap,
}: HeaderProps) => {
  // Get exporters from mind map instance
  const getMindMapExporters = () => {
    if (!mindMap) return {};
    
    return {
      onExportSVG: () => {
        mindMap?.exportSVG();
      },
      onExportPNG: () => {
        mindMap?.exportPNG();
      },
      onExportJSON: () => {
        mindMap?.exportJSON();
      },
      onExportPDF: () => {
        // Add PDF export functionality
        if (mindMap?.exportPDF) {
          mindMap.exportPDF();
        } else {
          console.warn("PDF export not available in this mind map instance");
        }
      }
    };
  };
  
  const exporters = getMindMapExporters();

  return (
    <HeaderSidebar
      isPdfActive={isPdfActive}
      isChatActive={isChatActive}
      togglePdf={togglePdf}
      toggleChat={toggleChat}
      setShowSummary={setShowSummary}
      setShowFlowchart={setShowFlowchart}
      onExportSVG={exporters.onExportSVG}
      onExportPNG={exporters.onExportPNG}
      onExportJSON={exporters.onExportJSON}
      onExportPDF={exporters.onExportPDF}
      enableSnapshotMode={() => {
        // Dispatch a custom event to enable snapshot mode
        window.dispatchEvent(new CustomEvent('enableSnapshotMode'));
      }}
    />
  );
};

export default Header;
