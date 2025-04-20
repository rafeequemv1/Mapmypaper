
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);  // Set default to true
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);

  const handleMindMapReady = useCallback(() => {
    setIsMapGenerated(true);
  }, []);

  useEffect(() => {
    if (location.state?.presetQuestion) {
      setExplainText(location.state.presetQuestion);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        togglePdf={() => setShowPdf(!showPdf)}
        toggleChat={() => setShowChat(!showChat)}
        setShowSummary={() => {}}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={null}
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
    </div>
  );
};

export default MindMap;
