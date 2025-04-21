
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Upload,
  MessageSquare,
  Image,
  FileJson,
  File,
  FilePdf,
  FileChartPie,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadMindMapAsPNG, downloadMindMapAsSVG } from "@/lib/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MindElixirInstance } from "mind-elixir";
import UserMenu from "@/components/UserMenu";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
  openFlowchart?: () => void;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  isPdfActive,
  isChatActive,
  mindMap,
  openFlowchart,
}: HeaderProps) => {
  const [fileName, setFileName] = useState("mindmap");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Add logging to help debug
  useEffect(() => {
    console.log("Mind map instance in Header:", mindMap);
  }, [mindMap]);
  
  // Handle export as PNG
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
  
  // Handle export as SVG
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
  
  // Handle export as JSON
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
  
  // Check if we have PDF data
  React.useEffect(() => {
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
    <>
      {/* Vertical Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-12 bg-white border-r flex flex-col items-center py-20 gap-2 z-10">
        <Button 
          variant={isPdfActive ? "default" : "ghost"} 
          onClick={togglePdf} 
          className={`w-9 h-9 p-0 ${isPdfActive ? "text-blue-600 bg-blue-50" : "text-black"}`}
          title="Toggle PDF"
        >
          <FilePdf className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={isChatActive ? "default" : "ghost"} 
          onClick={toggleChat} 
          className={`w-9 h-9 p-0 ${isChatActive ? "text-blue-600 bg-blue-50" : "text-black"}`}
          title="Toggle Chat"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={() => setShowSummary(true)} 
          className="w-9 h-9 p-0 text-black"
          title="Show Summary"
        >
          <FileText className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={openFlowchart}
          className="w-9 h-9 p-0 text-black"
          title="Open Flowchart"
        >
          <FileChartPie className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0" title="Export">
              <Download className="h-4 w-4 text-black" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportSVG} className="flex items-center gap-2 cursor-pointer">
              <Image className="h-4 w-4" />
              <span>Export as SVG</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPNG} className="flex items-center gap-2 cursor-pointer">
              <Image className="h-4 w-4" />
              <span>Export as PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON} className="flex items-center gap-2 cursor-pointer">
              <FileJson className="h-4 w-4" />
              <span>Export as JSON</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu in Vertical Sidebar */}
        <div className="mt-auto mb-4">
          <UserMenu />
        </div>
      </div>
    </>
  );
};

export default Header;

