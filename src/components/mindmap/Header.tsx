import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Download, MessageSquare, Image, FileJson, Upload, FileIcon, Braces, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadMindMapAsPNG, downloadMindMapAsSVG, downloadMindMapAsPDF } from "@/lib/export-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MindElixirInstance } from "mind-elixir";
import UserMenu from "@/components/UserMenu";
import PaperLogo from "@/components/PaperLogo";
import { useVisualizationContext } from "@/contexts/VisualizationContext";
interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  mindMap: MindElixirInstance | null;
}
const Header = ({
  togglePdf,
  toggleChat,
  setShowSummary,
  isPdfActive,
  isChatActive,
  mindMap
}: HeaderProps) => {
  const [fileName, setFileName] = useState("mindmap");
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    openVisualization
  } = useVisualizationContext();

  // Handle export as PNG
  const handleExportPNG = () => {
    if (mindMap) {
      downloadMindMapAsPNG(mindMap, fileName);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.png`
      });
    } else {
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
      downloadMindMapAsSVG(mindMap, fileName);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.svg`
      });
    } else {
      toast({
        title: "Export failed",
        description: "Mind map instance not available",
        variant: "destructive"
      });
    }
  };

  // Handle export as PDF
  const handleExportPDF = () => {
    if (mindMap) {
      downloadMindMapAsPDF(mindMap, fileName);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.pdf`
      });
    } else {
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
      const data = mindMap.getData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], {
        type: "application/json"
      });
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
  return <header className="bg-white border-b py-2 px-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo with Beta tag */}
        <div className="flex items-center gap-2">
          <PaperLogo size="sm" />
          <div className="flex items-center">
            <h1 className="text-lg font-bold">mapmypaper</h1>
            <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">BETA</div>
          </div>
        </div>
        
        {/* Center - Main Button Group */}
        <div className="flex items-center gap-2 md:gap-3 absolute left-1/2 transform -translate-x-1/2">
          <Button variant={isPdfActive ? "default" : "ghost"} onClick={togglePdf} className={`flex items-center gap-1 ${isPdfActive ? "text-blue-600 bg-blue-50" : "text-black"} h-8 px-3`}>
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">PDF</span>
          </Button>
          
          <Button variant={isChatActive ? "default" : "ghost"} onClick={toggleChat} className={`flex items-center gap-1 ${isChatActive ? "text-blue-600 bg-blue-50" : "text-black"} h-8 px-3`}>
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Chat</span>
          </Button>
          
          <Button variant="ghost" onClick={() => setShowSummary(true)} className="flex items-center gap-1 text-black h-8 px-3">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Summary</span>
          </Button>
          
          <Button variant="ghost" onClick={() => openVisualization("mindmap")} className="flex items-center gap-1 text-black h-8 px-3">
            <Braces className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Mind Map</span>
          </Button>
          
          <Button variant="ghost" onClick={() => openVisualization("flowchart")} className="flex items-center gap-1 text-black h-8 px-3">
            <GitBranch className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Flowchart</span>
          </Button>
        </div>
        
        {/* Right side - Action buttons and User Menu */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/")}>
            <Upload className="h-3.5 w-3.5 text-black" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Download className="h-3.5 w-3.5 text-black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border shadow-md z-50">
              <DropdownMenuItem onClick={handleExportSVG} className="flex items-center gap-2 cursor-pointer">
                <Image className="h-4 w-4" />
                <span>Export as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPNG} className="flex items-center gap-2 cursor-pointer">
                <Image className="h-4 w-4" />
                <span>Export as PNG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="flex items-center gap-2 cursor-pointer">
                <FileIcon className="h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON} className="flex items-center gap-2 cursor-pointer">
                <FileJson className="h-4 w-4" />
                <span>Export as JSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <UserMenu />
        </div>
      </div>
    </header>;
};
export default Header;
