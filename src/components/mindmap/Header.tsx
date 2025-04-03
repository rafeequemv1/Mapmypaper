
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GitCommitHorizontal,
  FileText,
  Download,
  Upload,
  MessageSquare,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadMindMapAsSVG } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMermaidMindmap: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
  onExportMindMap?: () => Promise<void>;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  setShowMermaidMindmap,
  isPdfActive,
  isChatActive,
  onExportMindMap,
}: HeaderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handle export click
  const handleExport = async () => {
    if (onExportMindMap) {
      try {
        await onExportMindMap();
        toast({
          title: "Export successful",
          description: "Mind map exported as SVG"
        });
      } catch (error) {
        toast({
          title: "Export failed",
          description: "There was an error exporting the mind map",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Mind map not ready",
        description: "Please wait for the mind map to load",
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
    <header className="bg-white border-b py-2 px-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo with Beta tag */}
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-md">
            <Upload className="h-4 w-4" />
          </div>
          <div className="flex items-center">
            <h1 className="text-lg font-bold">mapmypaper</h1>
            <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">BETA</div>
          </div>
        </div>
        
        {/* Center - Main Button Group */}
        <div className="flex items-center gap-2 md:gap-3 absolute left-1/2 transform -translate-x-1/2">
          <Button 
            variant={isPdfActive ? "default" : "ghost"} 
            onClick={togglePdf} 
            className={`flex items-center gap-1 ${isPdfActive ? "text-blue-600 bg-blue-50" : "text-black"} h-8 px-3`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">PDF</span>
          </Button>
          
          <Button 
            variant={isChatActive ? "default" : "ghost"} 
            onClick={toggleChat} 
            className={`flex items-center gap-1 ${isChatActive ? "text-blue-600 bg-blue-50" : "text-black"} h-8 px-3`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Chat</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowSummary(true)} 
            className="flex items-center gap-1 text-black h-8 px-3"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Summary</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowFlowchart && setShowFlowchart(true)} 
            className="flex items-center gap-1 text-black h-8 px-3"
          >
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Flowchart</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowMermaidMindmap(true)} 
            className="flex items-center gap-1 text-black h-8 px-3"
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-sm">Mindmap</span>
          </Button>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate("/")}>
            <Upload className="h-3.5 w-3.5 text-black" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 flex items-center gap-1"
            onClick={handleExport}
            title="Export as SVG"
          >
            <Download className="h-3.5 w-3.5 text-black" />
            <span className="hidden md:inline text-xs">SVG</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
