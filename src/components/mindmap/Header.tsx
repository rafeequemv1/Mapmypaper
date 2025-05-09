
import React from "react";
import { MindElixirInstance } from "mind-elixir";
import HeaderSidebar from "./HeaderSidebar";
import { downloadMindMapAsPNG, downloadMindMapAsSVG } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob } from "@/utils/downloadUtils";

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
      // Using downloadMindMapAsSVG from export-utils
      downloadMindMapAsSVG(mindMap, "mindmap");
      
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
      
      // Using downloadMindMapAsPNG from export-utils
      await downloadMindMapAsPNG(mindMap, "mindmap");
      
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
      // Export the data as JSON using the mind-elixir API
      const jsonData = mindMap.getData();
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      downloadBlob(blob, "mindmap.json");
      
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
