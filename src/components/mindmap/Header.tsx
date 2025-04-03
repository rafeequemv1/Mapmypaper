
import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { downloadMindMapAsPNG, downloadMindMapAsSVG } from "@/lib/export-utils";

interface HeaderProps {
  togglePdf: () => void;
  toggleChat: () => void;
  setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFlowchart?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMermaidMindmap: React.Dispatch<React.SetStateAction<boolean>>;
  isPdfActive: boolean;
  isChatActive: boolean;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  setShowMermaidMindmap,
  isPdfActive,
  isChatActive,
}: HeaderProps) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [fileName, setFileName] = useState("mindmap");
  const [mindElixirInstance, setMindElixirInstance] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handle mind map instance being ready
  const handleMindMapReady = (instance: any) => {
    setMindElixirInstance(instance);
  };
  
  // Handle export as PNG
  const handleExportPNG = () => {
    if (mindElixirInstance) {
      downloadMindMapAsPNG(mindElixirInstance, fileName);
      setShowExportDialog(false);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.png`
      });
    }
  };
  
  // Handle export as SVG
  const handleExportSVG = () => {
    if (mindElixirInstance) {
      downloadMindMapAsSVG(mindElixirInstance, fileName);
      setShowExportDialog(false);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.svg`
      });
    }
  };
  
  // Handle export as JSON
  const handleExportJSON = () => {
    if (mindElixirInstance) {
      const data = mindElixirInstance.getData();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([
        dataStr
      ], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${fileName}.json`;
      link.href = url;
      link.click();
      setShowExportDialog(false);
      toast({
        title: "Export successful",
        description: `Mind map exported as ${fileName}.json`
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
          
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowExportDialog(true)}>
            <Download className="h-3.5 w-3.5 text-black" />
          </Button>
        </div>
      </div>
      
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Mind Map</DialogTitle>
            <DialogDescription>
              Choose a format to export your mind map
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                File name
              </Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleExportPNG} className="text-black">
              Export as PNG
            </Button>
            <Button variant="ghost" onClick={handleExportSVG} className="text-black">
              Export as SVG
            </Button>
            <Button variant="ghost" onClick={handleExportJSON} className="text-black">
              Export as JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
