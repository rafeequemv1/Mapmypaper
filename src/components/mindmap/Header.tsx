
import React from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { useMindElixirStore } from "@/stores/mindElixirStore";
import { getSvg, getImage } from "@/lib/export-utils";
import { exportJson } from "mind-elixir";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isPdfActive: boolean;
  isChatActive: boolean;
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: (show: boolean) => void;
  setShowFlowchart: (show: boolean) => void;
  mindMap: MindElixirInstance | null;
}

const Header: React.FC<HeaderProps> = ({ 
  isPdfActive, 
  isChatActive, 
  togglePdf, 
  toggleChat, 
  setShowSummary, 
  setShowFlowchart, 
  mindMap
}) => {
  const { toast } = useToast();
  
  const handleExportSVG = () => {
    if (!mindMap) {
      toast({
        title: "Error",
        description: "Mind map is not ready for export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const svgData = getSvg(mindMap);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      saveAs(blob, "mindmap.svg");
      
      toast({
        title: "Export Successful",
        description: "Mind map exported as SVG.",
      });
    } catch (error) {
      console.error("Failed to export SVG:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export mind map as SVG.",
        variant: "destructive",
      });
    }
  };
  
  const handleExportPNG = async () => {
    if (!mindMap) {
      toast({
        title: "Error",
        description: "Mind map is not ready for export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Processing",
        description: "Generating PNG image...",
      });
      
      const dataUrl = await getImage(mindMap);
      const link = document.createElement("a");
      link.download = "mindmap.png";
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export Successful",
        description: "Mind map exported as PNG.",
      });
    } catch (error) {
      console.error("Failed to export PNG:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export mind map as PNG.",
        variant: "destructive",
      });
    }
  };
  
  const handleExportJSON = () => {
    if (!mindMap) {
      toast({
        title: "Error",
        description: "Mind map is not ready for export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Use the exportJson function from mind-elixir
      const jsonData = exportJson(mindMap);
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      saveAs(blob, "mindmap.json");
      
      toast({
        title: "Export Successful",
        description: "Mind map exported as JSON.",
      });
    } catch (error) {
      console.error("Failed to export JSON:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export mind map as JSON.",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};

export default Header;
