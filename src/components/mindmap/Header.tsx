
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranchPlus,
  GitCommitHorizontal,
  ListOrdered,
  Network,
  FileText,
  Download,
  Upload,
  PanelLeft,
  MessageSquare,
  Settings,
  Share2,
  Trash2,
  Save,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import SequenceDiagramModal from "@/components/mindmap/SequenceDiagramModal";
import SummaryModal from "./SummaryModal";
import MindmapModal from "./MindmapModal";

const Header = () => {
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [showSequenceDiagramModal, setShowSequenceDiagramModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMindmapModal, setShowMindmapModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [fileName, setFileName] = useState("mindmap");
  const [shareLink, setShareLink] = useState("");
  const [mindElixirInstance, setMindElixirInstance] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handle mind map instance being ready
  const handleMindMapReady = (instance: any) => {
    setMindElixirInstance(instance);
  };
  
  // Generate a shareable link (mock implementation)
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const randomId = Math.random().toString(36).substring(2, 10);
    return `${baseUrl}/shared/${randomId}`;
  };
  
  // Handle share button click
  const handleShare = () => {
    const link = generateShareLink();
    setShareLink(link);
    setShowShareDialog(true);
  };
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard"
    });
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
  
  // Handle delete confirmation
  const handleDelete = () => {
    // Clear session storage
    sessionStorage.removeItem("mindMapData");
    sessionStorage.removeItem("pdfText");
    sessionStorage.removeItem("pdfData");
    sessionStorage.removeItem("uploadedPdfData");
    setShowDeleteDialog(false);
    toast({
      title: "Mind map deleted",
      description: "Your mind map has been deleted"
    });
    // Navigate back to upload page
    navigate("/");
  };
  
  // Handle save (mock implementation)
  const handleSave = () => {
    if (mindElixirInstance) {
      const data = mindElixirInstance.getData();
      // In a real app, you would save this to a database
      console.log("Saving mind map:", data);
      localStorage.setItem(`mindmap_${fileName}`, JSON.stringify(data));
      setShowSaveDialog(false);
      toast({
        title: "Mind map saved",
        description: `Your mind map "${fileName}" has been saved`
      });
    }
  };
  
  // Check if we have PDF data
  useEffect(() => {
    const pdfData = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    if (!pdfData) {
      toast({
        title: "No PDF loaded",
        description: "Please upload a PDF to use all features",
        variant: "destructive"
      });
    }
  }, [
    toast
  ]);
  
  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-black text-white p-2 rounded-md">
          <FileUp className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">MapMyPaper</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          <Upload className="h-4 w-4 mr-2" />
          Upload New
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <GitBranchPlus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowFlowchartModal(true)}>
              <GitCommitHorizontal className="h-4 w-4 mr-2" />
              Flowchart
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSequenceDiagramModal(true)}>
              <ListOrdered className="h-4 w-4 mr-2" />
              Sequence Diagram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowMindmapModal(true)}>
              <Network className="h-4 w-4 mr-2" />
              Mindmap
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowSummaryModal(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Summary
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
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
            <Button variant="outline" onClick={handleExportPNG}>
              Export as PNG
            </Button>
            <Button variant="outline" onClick={handleExportSVG}>
              Export as SVG
            </Button>
            <Button onClick={handleExportJSON}>Export as JSON</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Mind Map</DialogTitle>
            <DialogDescription>
              Share this link with others to view your mind map
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly />
            <Button variant="outline" onClick={copyShareLink}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mind Map</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mind map? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Mind Map</DialogTitle>
            <DialogDescription>
              Enter a name to save your mind map
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="save-filename" className="text-right">
                File name
              </Label>
              <Input
                id="save-filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FlowchartModal
        open={showFlowchartModal}
        onOpenChange={setShowFlowchartModal}
      />
      <SequenceDiagramModal
        open={showSequenceDiagramModal}
        onOpenChange={setShowSequenceDiagramModal}
      />
      <SummaryModal
        open={showSummaryModal}
        onOpenChange={setShowSummaryModal}
      />
      <MindmapModal
        open={showMindmapModal}
        onOpenChange={setShowMindmapModal}
      />
    </header>
  );
};

export default Header;
