
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { setCurrentPdfKey } from "@/utils/pdfStorage";
import { getAllPdfs } from "@/components/PdfTabs";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
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

  // Listen for tab changes to update PDF text in session storage
  useEffect(() => {
    const handleTabChange = (e: CustomEvent) => {
      if (e.detail?.activeKey) {
        const key = e.detail.activeKey;
        // Update the current PDF key
        setCurrentPdfKey(key);
        
        // Get PDF text for this specific PDF and store it as the main text
        const pdfText = sessionStorage.getItem(`pdfText_${key}`);
        if (pdfText) {
          sessionStorage.setItem('pdfText', pdfText);
        }
      }
    };
    
    window.addEventListener('pdfTabChanged', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('pdfTabChanged', handleTabChange as EventListener);
    };
  }, []);

  // Initialize with the first PDF if available
  useEffect(() => {
    const pdfs = getAllPdfs();
    if (pdfs.length > 0) {
      // Use the first PDF as default if no current PDF is set
      const currentPdfKey = sessionStorage.getItem('currentPdfKey');
      if (!currentPdfKey) {
        const firstPdfKey = `${pdfs[0].name}_${pdfs[0].size}_${pdfs[0].lastModified}`;
        setCurrentPdfKey(firstPdfKey);
      }
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        togglePdf={() => setShowPdf(!showPdf)}
        toggleChat={() => setShowChat(!showChat)}
        setShowSummary={setShowSummary}
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
