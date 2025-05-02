import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import MermaidModal from "@/components/mindmap/MermaidModal";
import { MindElixirInstance } from "mind-elixir";
import { getCurrentPdf } from "@/utils/pdfStorage";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainImage, setExplainImage] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showMermaid, setShowMermaid] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [mindMapInstance, setMindMapInstance] = useState<MindElixirInstance | null>(null);
  const [activePdfKey, setActivePdfKey] = useState<string | null>(null);

  // On first load, check if there's a current PDF key
  useEffect(() => {
    const initialSetup = async () => {
      // First check if we have a PDF key from the location state (used when coming from PdfUpload)
      if (location.state?.pdfKey) {
        console.log("Setting PDF key from location state:", location.state.pdfKey);
        setActivePdfKey(location.state.pdfKey);
      } else {
        // Otherwise try to get the current PDF key from localStorage
        const currentKey = getCurrentPdf();
        console.log("Current PDF key from storage:", currentKey);
        if (currentKey) {
          setActivePdfKey(currentKey);
        }
      }
    };
    
    initialSetup();
  }, [location.state]);

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
  }, []);

  // Toggle chat function
  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);

  // Handle text selection from PDF
  const handleTextSelected = useCallback((text: string) => {
    if (text) {
      setExplainText(text);
      if (!showChat) {
        setShowChat(true);
      }
    }
  }, [showChat]);

  // Handle image capture from PDF
  const handleImageCaptured = useCallback((imageData: string) => {
    if (imageData) {
      setExplainImage(imageData);
      if (!showChat) {
        setShowChat(true);
      }
    }
  }, [showChat]);

  // Listen for text selection events that should activate chat
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

  // Listen for image capture events that should activate chat
  useEffect(() => {
    const handleImageCaptured = (e: CustomEvent) => {
      if (e.detail?.imageData) {
        setExplainImage(e.detail.imageData);
        if (!showChat) {
          setShowChat(true);
        }
      }
    };
    
    window.addEventListener('openChatWithImage', handleImageCaptured as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithImage', handleImageCaptured as EventListener);
    };
  }, [showChat]);

  // Listen for PDF tab changes
  useEffect(() => {
    const handlePdfSwitched = (e: CustomEvent) => {
      if (e.detail?.pdfKey) {
        console.log("PDF switched to:", e.detail.pdfKey);
        setActivePdfKey(e.detail.pdfKey);
      }
    };
    
    window.addEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    
    return () => {
      window.removeEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    };
  }, []);

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
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        setShowMermaid={setShowMermaid}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={mindMapInstance}
      />
      <PanelStructure
        showPdf={showPdf}
        showChat={showChat}
        toggleChat={toggleChat}
        togglePdf={() => setShowPdf(!showPdf)}
        onMindMapReady={handleMindMapReady}
        explainText={explainText}
        explainImage={explainImage}
        onExplainText={setExplainText}
        onTextSelected={handleTextSelected}
        onImageCaptured={handleImageCaptured}
        activePdfKey={activePdfKey}
        onActivePdfKeyChange={setActivePdfKey}
      />
      
      {/* Modal for Summary */}
      <SummaryModal 
        open={showSummary}
        onOpenChange={setShowSummary}
        pdfKey={activePdfKey}
      />
      
      {/* Modal for Mermaid Flowchart */}
      <MermaidModal 
        open={showMermaid}
        onOpenChange={setShowMermaid}
        pdfKey={activePdfKey}
      />
    </div>
  );
};

export default MindMap;
