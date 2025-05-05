
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { downloadMindMapAsPNG, downloadMindMapAsSVG } from "@/lib/export-utils";
import HeaderSidebar from "./HeaderSidebar";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
}

const Header: React.FC<HeaderProps> = ({
  togglePdf,
  toggleChat,
  setShowSummary,
  isPdfActive,
  isChatActive,
  mindMap,
}) => {
  const [fileName, setFileName] = useState("mindmap");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Mind map instance in Header:", mindMap);
  }, [mindMap]);

  const handleExportPNG = () => {
    if (mindMap) {
      console.log("Exporting as PNG with mind map:", mindMap);
      downloadMindMapAsPNG(mindMap, fileName);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.png`
      });
    } else {
      console.error("Mind map instance not available for PNG export");
      toast({
        title: "Export failed",
        description: "Mind map instance not available",
        variant: "destructive"
      });
    }
  };

  const handleExportSVG = () => {
    if (mindMap) {
      console.log("Exporting as SVG with mind map:", mindMap);
      downloadMindMapAsSVG(mindMap, fileName);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.svg`
      });
    } else {
      console.error("Mind map instance not available for SVG export");
      toast({
        title: "Export failed",
        description: "Mind map instance not available",
        variant: "destructive"
      });
    }
  };

  const handleExportJSON = () => {
    if (mindMap) {
      console.log("Exporting as JSON with mind map:", mindMap);
      const data = mindMap.getData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${fileName}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.json`
      });
    } else {
      console.error("Mind map instance not available for JSON export");
      toast({
        title: "Export failed",
        description: "Mind map instance not available",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const pdfData = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    if (!pdfData) {
      toast({
        title: "No PDF loaded",
        description: "Please upload a PDF to use all features",
        variant: "destructive"
      });
    }
  }, [toast]);

  return (
    <HeaderSidebar
      isPdfActive={isPdfActive}
      isChatActive={isChatActive}
      togglePdf={togglePdf}
      toggleChat={toggleChat}
      setShowSummary={setShowSummary}
      onExportSVG={handleExportSVG}
      onExportPNG={handleExportPNG}
      onExportJSON={handleExportJSON}
    />
  );
};

export default Header;
