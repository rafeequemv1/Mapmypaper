
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
import { Home } from "lucide-react";

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

  // Navigation and dialog state
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance in MindMap component:", instance);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Home button at top-left - Icon only without text */}
      <div className="fixed top-3 left-3 z-[60]">
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8" 
              onClick={() => setShowAlert(true)}
              title="Return to Home"
            >
              <Home className="w-5 h-5" />
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
    </div>
  );
};

export default MindMap;
