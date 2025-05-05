
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";

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

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
  }, []);

  // Handle text selected for explanation
  const handleExplainText = useCallback((text: string) => {
    setExplainText(text);
    if (!showChat) {
      setShowChat(true);
      toast({
        title: "Explain Feature",
        description: "Opening chat to explain selected text.",
      });
    }
  }, [showChat, toast]);

  // Listen for text selection events that should activate chat
  useEffect(() => {
    const handleTextSelected = (e: CustomEvent) => {
      if (e.detail?.text) {
        setExplainText(e.detail.text);
        // Open chat panel if it's not already open
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
        onExplainText={handleExplainText}
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
