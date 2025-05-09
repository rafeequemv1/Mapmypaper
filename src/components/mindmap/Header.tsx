
import React, { useCallback, useEffect, useState } from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { useToast } from "@/hooks/use-toast";
import { exportSVG, exportPNG, exportJSON } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  isPdfActive: boolean;
  isChatActive: boolean;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart: React.Dispatch<React.SetStateAction<boolean>>;
  mindMap: MindElixirInstance | null;
}

const Header: React.FC<HeaderProps> = ({
  togglePdf,
  toggleChat,
  isPdfActive,
  isChatActive,
  setShowSummary,
  setShowFlowchart,
  mindMap,
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const { toast } = useToast();
  
  // Import the ImageGalleryModal component dynamically
  const ImageGalleryModal = React.lazy(() => import('./ImageGalleryModal'));
  
  const handleExportSVG = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Failed",
        description: "Mind map not ready to export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportSVG(mindMap);
      toast({
        title: "Export Successful",
        description: "Mind map exported as SVG.",
      });
    } catch (error) {
      console.error("Error exporting SVG:", error);
      toast({
        title: "Export Failed",
        description: "Could not export as SVG. Try again later.",
        variant: "destructive",
      });
    }
  }, [mindMap, toast]);

  const handleExportPNG = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Failed",
        description: "Mind map not ready to export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportPNG(mindMap);
      toast({
        title: "Export Successful",
        description: "Mind map exported as PNG.",
      });
    } catch (error) {
      console.error("Error exporting PNG:", error);
      toast({
        title: "Export Failed",
        description: "Could not export as PNG. Try again later.",
        variant: "destructive",
      });
    }
  }, [mindMap, toast]);

  const handleExportJSON = useCallback(() => {
    if (!mindMap) {
      toast({
        title: "Export Failed",
        description: "Mind map not ready to export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportJSON(mindMap);
      toast({
        title: "Export Successful",
        description: "Mind map data exported as JSON.",
      });
    } catch (error) {
      console.error("Error exporting JSON:", error);
      toast({
        title: "Export Failed",
        description: "Could not export as JSON. Try again later.",
        variant: "destructive",
      });
    }
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
        setShowGallery={setShowGallery}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
      />
      
      {/* Lazy load the gallery modal to improve initial load time */}
      <React.Suspense fallback={null}>
        {showGallery && <ImageGalleryModal open={showGallery} onOpenChange={setShowGallery} />}
      </React.Suspense>
    </>
  );
};

export default Header;
