
import { useState, useRef, useCallback } from "react";
import { MindElixirInstance } from "mind-elixir";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import MindmapModal from "@/components/mindmap/MindmapModal";
import { useAuth } from "@/hooks/useAuth";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [explainText, setExplainText] = useState<string>("");
  const mindElixirInstance = useRef<MindElixirInstance | null>(null);
  const { user, refreshSession } = useAuth();
  
  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    mindElixirInstance.current = instance;
    
    // Auto-expand the map 
    if (instance && instance.nodeData) {
      try {
        // Get the root node and expand it
        if (instance.nodeData.id) {
          instance.expandNode(instance.nodeData.id);
        }
      } catch (err) {
        console.log("Error expanding root node:", err);
      }
    }
  }, []);
  
  const togglePdf = () => setShowPdf(prev => !prev);
  const toggleChat = () => setShowChat(prev => !prev);
  
  const onExplainText = (text: string) => {
    // Trim text to avoid empty selections
    const trimmedText = text.trim();
    
    if (trimmedText) {
      setExplainText(trimmedText);
      
      // Ensure chat panel is visible when text is selected
      if (!showChat) {
        setShowChat(true);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        togglePdf={togglePdf} 
        toggleChat={toggleChat} 
        setShowSummary={setShowSummary}
        setShowFlowchart={setShowFlowchart}
        setShowMindmap={setShowMindmap}
        user={user}
        onAuthChange={refreshSession}
      />
      
      <div className="flex-1 overflow-hidden">
        <PanelStructure
          showPdf={showPdf}
          showChat={showChat}
          toggleChat={toggleChat}
          togglePdf={togglePdf}
          onMindMapReady={handleMindMapReady}
          explainText={explainText}
          onExplainText={onExplainText}
        />
      </div>
      
      {/* Modals */}
      <SummaryModal open={showSummary} onOpenChange={setShowSummary} />
      <FlowchartModal open={showFlowchart} onOpenChange={setShowFlowchart} />
      <MindmapModal open={showMindmap} onOpenChange={setShowMindmap} />
    </div>
  );
};

export default MindMap;
