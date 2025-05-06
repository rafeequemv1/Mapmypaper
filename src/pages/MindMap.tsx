
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import { MindElixirInstance } from "mind-elixir";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [mindMapInstance, setMindMapInstance] = useState<MindElixirInstance | null>(null);
  const [currentPdfKey, setCurrentPdfKey] = useState<string | null>(null);

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

  // Listen for tab changes to update PDF text in session storage and track current PDF key
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail?.activeKey) {
        const key = e.detail.activeKey;
        console.log("Current PDF set to:", key);
        setCurrentPdfKey(key);
        
        // Get PDF text for this specific PDF and store it as the main text
        const pdfText = sessionStorage.getItem(`pdfText_${key}`);
        if (pdfText) {
          sessionStorage.setItem('pdfText', pdfText);
        }
        
        // Notify other components about the PDF change with the forceUpdate flag
        // This helps ensure that visualizations and mindmaps update properly
        const forceUpdate = e.detail.forceUpdate === undefined ? true : e.detail.forceUpdate;
        if (forceUpdate) {
          console.log("Broadcasting pdfSwitched event with forceUpdate");
          window.dispatchEvent(
            new CustomEvent('pdfSwitched', { 
              detail: { 
                pdfKey: key,
                forceUpdate: true 
              } 
            })
          );
        }
      }
    };
    
    window.addEventListener('pdfTabChanged', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('pdfTabChanged', handleTabChange as EventListener);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with left sidebar icons */}
      <Header 
        togglePdf={() => setShowPdf(!showPdf)}
        toggleChat={() => setShowChat(!showChat)}
        setShowSummary={setShowSummary}
        setShowFlowchart={setShowFlowchart}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={mindMapInstance}
      />
      <PanelStructure
        showPdf={showPdf}
        showChat={showChat}
        toggleChat={() => setShowChat(!showChat)}
        togglePdf={() => setShowPdf(!showPdf)}
        onMindMapReady={handleMindMapReady}
        explainText={explainText}
        onExplainText={handleExplainText}
        currentPdfKey={currentPdfKey}
      />
      
      {/* Modal for Summary */}
      <SummaryModal 
        open={showSummary}
        onOpenChange={setShowSummary}
      />

      {/* Modal for Flowchart/Mindmap visualization */}
      <FlowchartModal
        open={showFlowchart}
        onOpenChange={setShowFlowchart}
        currentPdfKey={currentPdfKey}
      />
    </div>
  );
};

export default MindMap;
