
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranchPlus,
  GitCommitHorizontal,
  ListOrdered,
  Network,
  FileText,
  Download,
  Upload,
  MessageSquare,
  Save,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  setShowSequenceDiagram?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMindmap?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({ 
  togglePdf, 
  toggleChat, 
  setShowSummary,
  setShowFlowchart,
  setShowSequenceDiagram,
  setShowMindmap
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
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-black text-white p-2 rounded-md">
          <FileUp className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">mapmypaper</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Middle section with PDF, Chat, Summary buttons with text */}
        <Button size="sm" onClick={togglePdf} className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden md:inline">PDF</span>
        </Button>
        <Button size="sm" onClick={toggleChat} className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Chat</span>
        </Button>
        <Button size="sm" onClick={() => setShowSummary(true)} className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span className="hidden md:inline">Summary</span>
        </Button>
        
        {/* Right section with icon-only buttons */}
        <Button size="icon" onClick={() => navigate("/")}>
          <Upload className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon">
              <GitBranchPlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowFlowchart && setShowFlowchart(true)}>
              <GitCommitHorizontal className="h-4 w-4 mr-2" />
              Flowchart
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSequenceDiagram && setShowSequenceDiagram(true)}>
              <ListOrdered className="h-4 w-4 mr-2" />
              Sequence Diagram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMindmap && setShowMindmap(true)}>
              <Network className="h-4 w-4 mr-2" />
              Mindmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="icon" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4" />
        </Button>
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
            <Button variant="secondary" onClick={handleExportPNG}>
              Export as PNG
            </Button>
            <Button variant="secondary" onClick={handleExportSVG}>
              Export as SVG
            </Button>
            <Button onClick={handleExportJSON}>Export as JSON</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
