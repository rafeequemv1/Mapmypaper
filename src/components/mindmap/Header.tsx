import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, FileText, MessageSquare, Download, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Textarea } from "@/components/ui/textarea";
import FlowchartModal from "./FlowchartModal";

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap: (type: 'svg' | 'png') => void;
  onOpenSummary: () => void;
  detailLevel: 'basic' | 'detailed' | 'advanced';
  onDetailLevelChange: (level: 'basic' | 'detailed' | 'advanced') => void;
}

const Header = ({
  showPdf,
  togglePdf,
  pdfAvailable,
  showChat,
  toggleChat,
  onExportMindMap,
  onOpenSummary,
  detailLevel,
  onDetailLevelChange,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documentTitle, setDocumentTitle] = useState<string>("Document Analysis");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [flowchartModalOpen, setFlowchartModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Extract document title from sessionStorage
  useEffect(() => {
    try {
      // Try to get the file name from session storage
      const pdfFileName = sessionStorage.getItem('pdfFileName');
      if (pdfFileName) {
        // If filename exists, use it
        setDocumentTitle(pdfFileName);
        // Also use it as the default title for saving
        setTitle(pdfFileName);
      }
    } catch (error) {
      console.error("Error retrieving document title:", error);
    }
  }, []);
  
  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSaveConfirm = useCallback(async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your mind map",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get current mindmap data from session storage
      const mindmapData = sessionStorage.getItem('mindMapData');
      // Get PDF data from session storage
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      // Get PDF filename from session storage
      const pdfFileName = sessionStorage.getItem('pdfFileName');
      
      const { data, error } = await supabase
        .from('user_mindmaps')
        .insert({
          user_id: user?.id,
          title: title,
          description: description,
          pdf_data: pdfData,
          pdf_filename: pdfFileName,
          mindmap_data: mindmapData ? JSON.parse(mindmapData) : null,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Saved successfully",
        description: "Your mind map has been saved",
      });

      setSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving mind map:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your mind map",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [title, description, user, toast]);

  const handleFlowchartClick = () => {
    setFlowchartModalOpen(true);
  };

  return (
    <header className="border-b border-[#eaeaea] dark:border-[#333] bg-white dark:bg-[#111] p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleGoHome} className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#222] p-1">
          <Brain className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-medium truncate max-w-xs md:max-w-md text-black dark:text-white" title={documentTitle}>
          {documentTitle}
        </h1>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Detail Level Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-black dark:text-white h-7 flex gap-1 items-center"
            >
              <span className="text-xs capitalize">{detailLevel}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-[#222] border-[#eaeaea] dark:border-[#333]">
            <DropdownMenuLabel>Detail Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={detailLevel} onValueChange={(value) => onDetailLevelChange(value as 'basic' | 'detailed' | 'advanced')}>
              <DropdownMenuRadioItem 
                value="basic"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
              >
                Basic
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem 
                value="detailed"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
              >
                Detailed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem 
                value="advanced"
                className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
              >
                Advanced
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Flowchart Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleFlowchartClick}
          className="text-black dark:text-white h-7"
        >
          <span className="text-xs">Flowchart</span>
        </Button>
        
        {/* Existing buttons */}
        {pdfAvailable && (
          <Button 
            variant={showPdf ? "default" : "ghost"} 
            size="sm"
            onClick={togglePdf}
            className={`hidden md:flex h-7 ${
              showPdf 
                ? "bg-black text-white dark:bg-white dark:text-black" 
                : "text-black dark:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="ml-1 text-xs">PDF</span>
          </Button>
        )}
        
        <Button 
          variant={showChat ? "default" : "ghost"} 
          size="sm"
          onClick={toggleChat}
          className={`h-7 ${
            showChat 
              ? "bg-black text-white dark:bg-white dark:text-black" 
              : "text-black dark:text-white"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="ml-1 text-xs hidden md:inline">Chat</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onOpenSummary}
          className="text-black dark:text-white h-7"
        >
          <span className="text-xs">Summary</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-black dark:text-white h-7"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-[#222] border-[#eaeaea] dark:border-[#333]">
            <DropdownMenuItem 
              onClick={() => onExportMindMap('svg')}
              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
            >
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onExportMindMap('png')}
              className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
            >
              Export as PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoHome}
          className="text-black dark:text-white h-7"
        >
          <User className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#222] text-black dark:text-white">
          <DialogHeader>
            <DialogTitle>Save Mind Map</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Enter details to save your current mind map
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 bg-white dark:bg-[#333] text-black dark:text-white border-[#eaeaea] dark:border-[#444]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 bg-white dark:bg-[#333] text-black dark:text-white border-[#eaeaea] dark:border-[#444]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSaving}
              onClick={handleSaveConfirm}
              className="bg-black text-white dark:bg-white dark:text-black"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Flowchart Modal */}
      <FlowchartModal
        open={flowchartModalOpen}
        onOpenChange={setFlowchartModalOpen}
      />
    </header>
  );
};

export default Header;
