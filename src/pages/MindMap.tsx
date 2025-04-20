
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import { MindmapModal } from "@/components/mindmap/MindmapModal";
import { MindElixirInstance } from "mind-elixir";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);  // Set default to true
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  // Add a state to store the mind map instance
  const [mindMapInstance, setMindMapInstance] = useState<MindElixirInstance | null>(null);

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
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
        setShowSummary={setShowSummary}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={mindMapInstance}
        openFlowchart={() => setShowFlowchart(true)}
        openMindmap={() => setShowMindmap(true)}
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
      
      {/* Modal for Mindmap */}
      <MindmapModal 
        isOpen={showMindmap} 
        onClose={() => setShowMindmap(false)}
      />
    </div>
  );
};

export default MindMap;
