
import { useState, useEffect } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import { MindElixirInstance } from "mind-elixir";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import MindmapModal from "@/components/mindmap/MindmapModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const MindMap = () => {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [showPdf, setShowPdf] = useState<boolean>(true);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [mindElixirInstance, setMindElixirInstance] = useState<MindElixirInstance | null>(null);
  const [openSummaryModal, setOpenSummaryModal] = useState<boolean>(false);
  const [openFlowchartModal, setOpenFlowchartModal] = useState<boolean>(false);
  const [openMindmapModal, setOpenMindmapModal] = useState<boolean>(false);
  const [explainText, setExplainText] = useState<string>("");

  // Check for PDF data on mount
  useEffect(() => {
    const hasPdfData = Boolean(sessionStorage.getItem("pdfData")) || Boolean(sessionStorage.getItem("uploadedPdfData"));
    
    if (!hasPdfData) {
      navigate("/");
    }
    
    // Expand all nodes when mindmap is ready
    if (mindElixirInstance) {
      try {
        console.log("Attempting to expand all nodes");
        
        // Use available methods in the MindElixir API to expand nodes
        if (mindElixirInstance.nodeData) {
          // Get access to the DOM elements representing the nodes
          const topicElements = document.querySelectorAll('.map-title');
          
          // Loop through each node element
          if (topicElements && topicElements.length > 0) {
            topicElements.forEach((element) => {
              try {
                // Get the node id from the data attribute
                const nodeId = element.getAttribute('data-nodeid');
                if (nodeId) {
                  // Use a workaround to find and expand nodes
                  // We need to find the Topic object that corresponds to this node ID
                  // Some versions of mind-elixir require a Topic object, not a string ID
                  const nodeObj = mindElixirInstance.get(nodeId);
                  if (nodeObj) {
                    mindElixirInstance.expandNode?.(nodeObj);
                  }
                }
              } catch (nodeError) {
                console.info("Error expanding individual node:", nodeError);
              }
            });
          } else {
            console.info("No topic elements found to expand");
          }
        }
      } catch (error) {
        console.info("Error expanding nodes:", error);
      }
    }
  }, [navigate, mindElixirInstance]);

  const togglePdf = () => setShowPdf(prev => !prev);
  const toggleChat = () => setShowChat(prev => !prev);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header 
        togglePdf={togglePdf} 
        toggleChat={toggleChat}
        setShowSummary={setOpenSummaryModal}
        setShowFlowchart={setOpenFlowchartModal}
        setShowMindmap={setOpenMindmapModal}
        user={user}
        onAuthChange={refreshSession}
      />
      
      <div className="flex-1 overflow-hidden">
        <PanelStructure 
          showPdf={showPdf} 
          showChat={showChat} 
          toggleChat={toggleChat}
          togglePdf={togglePdf}
          onMindMapReady={setMindElixirInstance}
          explainText={explainText}
          onExplainText={setExplainText}
        />
      </div>
      
      {/* Modals */}
      <SummaryModal 
        open={openSummaryModal} 
        onOpenChange={setOpenSummaryModal} 
      />
      
      <FlowchartModal
        open={openFlowchartModal}
        onOpenChange={setOpenFlowchartModal}
      />
      
      <MindmapModal
        open={openMindmapModal}
        onOpenChange={setOpenMindmapModal}
      />
    </div>
  );
};

export default MindMap;
