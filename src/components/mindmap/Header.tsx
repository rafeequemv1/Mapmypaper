
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, FileText, MessageSquare, Download, User, Save, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap: (type: 'svg' | 'png') => void;
  onOpenSummary: () => void;
}

const Header = ({
  showPdf,
  togglePdf,
  pdfAvailable,
  showChat,
  toggleChat,
  onExportMindMap,
  onOpenSummary,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documentTitle, setDocumentTitle] = useState<string>("Document Analysis");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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

  const handleSaveMindMap = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your mind map",
        variant: "destructive"
      });
      return;
    }

    setSaveDialogOpen(true);
  }, [user, toast]);

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
      // Get chat history (if needed)
      // Note: You'll need to implement chat history saving in ChatPanel
      
      const { data, error } = await supabase
        .from('user_mindmaps')
        .insert({
          user_id: user?.id,
          title: title,
          description: description,
          pdf_data: pdfData,
          pdf_filename: pdfFileName,
          mindmap_data: mindmapData ? JSON.parse(mindmapData) : null,
          // chat_history: null, // For now, not saving chat history
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

  const handleOpenDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  return (
    <header className="border-b border-[#eaeaea] dark:border-[#333] bg-white dark:bg-[#111] p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleGoHome} className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#222]">
          <Brain className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium truncate max-w-xs md:max-w-md text-black dark:text-white" title={documentTitle}>
          MapMyPaper - {documentTitle}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {pdfAvailable && (
          <Button 
            variant={showPdf ? "default" : "outline"} 
            size="sm"
            onClick={togglePdf}
            className={`hidden md:flex ${
              showPdf 
                ? "bg-black text-white dark:bg-white dark:text-black" 
                : "text-black border-black dark:text-white dark:border-white"
            }`}
          >
            <FileText className="mr-1 h-4 w-4" />
            PDF
          </Button>
        )}
        
        <Button 
          variant={showChat ? "default" : "outline"} 
          size="sm"
          onClick={toggleChat}
          className={
            showChat 
              ? "bg-black text-white dark:bg-white dark:text-black" 
              : "text-black border-black dark:text-white dark:border-white"
          }
        >
          <MessageSquare className="mr-1 h-4 w-4" />
          <span className="hidden md:inline">Chat</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onOpenSummary}
          className="text-black border-black dark:text-white dark:border-white"
        >
          Summary
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSaveMindMap}
          className="text-black border-black dark:text-white dark:border-white hidden sm:flex"
        >
          <Save className="mr-1 h-4 w-4" />
          Save
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenDashboard}
          className="text-black border-black dark:text-white dark:border-white hidden sm:flex"
        >
          <Grid className="mr-1 h-4 w-4" />
          Dashboard
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="text-black border-black dark:text-white dark:border-white"
            >
              <Download className="h-4 w-4" />
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
          variant="outline" 
          size="icon" 
          onClick={handleGoHome}
          className="text-black border-black dark:text-white dark:border-white"
        >
          <User className="h-4 w-4" />
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
    </header>
  );
};

export default Header;
