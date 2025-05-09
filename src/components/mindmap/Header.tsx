
import React, { useState, useCallback, useEffect } from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { useToast } from "@/hooks/use-toast";
import { exportSVG, exportPNG, exportJSON } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGallery: React.Dispatch<React.SetStateAction<boolean>>; // Add gallery state setter
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
}

const Header: React.FC<HeaderProps> = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  setShowGallery,
  isPdfActive,
  isChatActive,
  mindMap
}) => {
  const { toast } = useToast();
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // Import the ImageGalleryModal component dynamically
  const ImageGalleryModal = React.lazy(() => import('./ImageGalleryModal'));
  
  const handleExportSVG = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Error",
        description: "Mindmap not initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    exportSVG(mindMap, (result) => {
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "Mind map exported as SVG.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Unable to export mind map.",
          variant: "destructive",
        });
      }
    });
  }, [mindMap, toast]);
  
  const handleExportPNG = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Error",
        description: "Mindmap not initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    exportPNG(mindMap, (result) => {
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "Mind map exported as PNG.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Unable to export mind map.",
          variant: "destructive",
        });
      }
    });
  }, [mindMap, toast]);
  
  const handleExportJSON = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Error",
        description: "Mindmap not initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    exportJSON(mindMap, (result) => {
      if (result.success) {
        toast({
          title: "Export Successful",
          description: "Mind map data exported as JSON.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "Unable to export mind map data.",
          variant: "destructive",
        });
      }
    });
  }, [mindMap, toast]);

  return (
    <>
      <HeaderSidebar 
        isPdfActive={isPdfActive}
        isChatActive={isChatActive}
        togglePdf={togglePdf}
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        setShowFlowchart={setShowFlowchart}
        setShowGallery={setShowGallery} // Pass the gallery state setter
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
      />
    </>
  );
};

export default Header;
