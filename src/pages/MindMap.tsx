
import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Home, Save } from "lucide-react";
import { useSupabaseClient } from "@supabase/supabase-js";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [mindMapInstance, setMindMapInstance] = useState<MindElixirInstance | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useSupabaseClient();
  const { user } = useAuthContext();

  // Navigation and dialog state
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
  }, []);

  useEffect(() => {
    const handleTextSelected = (e: CustomEvent) => {
      if (e.detail?.text) {
        setExplainText(e.detail.text);
        if (!showChat) {
          setShowChat(true);
        }
      }
    };
    window.addEventListener('openChatWithText', handleTextSelected as EventListener);
    return () => {
      window.removeEventListener('openChatWithText', handleTextSelected as EventListener);
    };
  }, [showChat]);

  useEffect(() => {
    if (location.state?.presetQuestion) {
      setExplainText(location.state.presetQuestion);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Handler for confirming navigation
  const handleHomeConfirm = () => {
    setShowAlert(false);
    navigate("/");
  };

  // Save the current mindmap project
  const handleSaveProject = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your mindmap project.",
        variant: "destructive",
      });
      return;
    }

    if (!mindMapInstance) {
      toast({
        title: "Mind Map Not Ready",
        description: "Please wait for the mind map to fully load before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!projectTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your mindmap project.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get current active PDF key
      const activePdfKey = sessionStorage.getItem('currentPdfKey');
      
      // Get mindmap data
      const mindMapData = mindMapInstance.getData();
      
      // Get PDF data from IndexedDB if available
      let pdfData = null;
      if (activePdfKey) {
        const pdfResponse = await fetch(`/api/pdf/${activePdfKey}`);
        if (pdfResponse.ok) {
          pdfData = await pdfResponse.text();
        }
      }
      
      // Get chat history from session storage if available
      const chatHistory = sessionStorage.getItem('chatHistory') || '[]';
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('user_mindmaps')
        .insert({
          user_id: user.id,
          title: projectTitle,
          pdf_key: activePdfKey,
          pdf_data: pdfData,
          mindmap_data: JSON.stringify(mindMapData),
          chat_history: chatHistory,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your mindmap project has been saved.",
      });
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your mindmap project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Home button at top-left */}
      <div className="fixed top-3 left-3 z-[60]">
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2" onClick={() => setShowAlert(true)}>
              <Home className="w-5 h-5" />
              Home
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Leave MindMap?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? Your current mindmap progress may be lost and unsaved changes will be discarded.
            </AlertDialogDescription>
            <div className="flex gap-4 mt-4 justify-end">
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleHomeConfirm}>Leave</Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Save button at top-right */}
      <div className="fixed top-3 right-3 z-[60]">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="w-4 h-4" />
          Save Project
        </Button>
      </div>
      
      <Header 
        togglePdf={() => setShowPdf(!showPdf)}
        toggleChat={() => setShowChat(!showChat)}
        setShowSummary={setShowSummary}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={mindMapInstance}
        openFlowchart={() => setShowFlowchart(true)}
      />
      <PanelStructure
        showPdf={showPdf}
        showChat={showChat}
        toggleChat={() => setShowChat(!showChat)}
        togglePdf={() => setShowPdf(!showPdf)}
        onMindMapReady={handleMindMapReady}
        explainText={explainText}
        onExplainText={setExplainText}
      />
      {/* Modal for Flowchart */}
      <FlowchartModal 
        open={showFlowchart} 
        onOpenChange={setShowFlowchart}
      />
      {/* Modal for Summary */}
      <SummaryModal 
        open={showSummary}
        onOpenChange={setShowSummary}
      />
      
      {/* Save Project Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Enter a title for your mindmap project to save it for later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-title" className="text-right">
                Title
              </Label>
              <Input
                id="project-title"
                placeholder="My Research Project"
                className="col-span-3"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject} 
              disabled={isSaving || !projectTitle.trim()}
            >
              {isSaving ? "Saving..." : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MindMap;
