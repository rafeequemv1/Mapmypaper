
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import MermaidModal from "@/components/mindmap/MermaidModal";
import ApiTroubleshooter from "@/components/mindmap/ApiTroubleshooter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MindElixirInstance } from "mind-elixir";
import { testGeminiConnection } from "@/services/geminiService";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainImage, setExplainImage] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showMermaid, setShowMermaid] = useState(false);
  const [showApiTroubleshooter, setShowApiTroubleshooter] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [mindMapInstance, setMindMapInstance] = useState<MindElixirInstance | null>(null);
  const [activePdfKey, setActivePdfKey] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
    setApiStatus('success');
  }, []);

  // Check if API key is available
  useEffect(() => {
    const checkApiKey = async () => {
      setApiStatus('loading');
      
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setApiStatus('error');
        toast({
          title: "API Key Missing",
          description: "Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        await testGeminiConnection();
        setApiStatus('success');
        console.log("API connection test successful");
      } catch (error) {
        setApiStatus('error');
        console.error("API connection test failed:", error);
        toast({
          title: "API Connection Failed",
          description: "Could not connect to Gemini API. Check your API key and internet connection.",
          variant: "destructive",
        });
      }
    };
    
    checkApiKey();
  }, [toast]);

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
        setActivePdfKey(e.detail.pdfKey);
      }
    };
    
    window.addEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    
    return () => {
      window.removeEventListener('pdfSwitched', handlePdfSwitched as EventListener);
    };
  }, []);

  // Handle API status changes for logging/debugging
  useEffect(() => {
    console.log(`Mindmap API status changed to: ${apiStatus}`);
    
    if (apiStatus === 'error') {
      console.error("Gemini API integration is not working correctly");
    }
  }, [apiStatus]);

  useEffect(() => {
    if (location.state?.presetQuestion) {
      setExplainText(location.state.presetQuestion);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Vertical sidebar with icons */}
      <Header 
        togglePdf={() => setShowPdf(!showPdf)}
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        setShowMermaid={setShowMermaid}
        isPdfActive={showPdf}
        isChatActive={showChat}
        mindMap={mindMapInstance}
        apiStatus={apiStatus}
        className="w-16 z-10"
      />
      
      <div className="flex-1 relative">
        {apiStatus === 'error' && (
          <Alert variant="destructive" className="absolute top-2 left-2 right-2 z-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>API Connection Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>Failed to connect to Gemini API. Mindmap generation may not work correctly.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowApiTroubleshooter(true)}
              >
                Troubleshoot
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
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
          onApiStatusChange={setApiStatus}
        />
      </div>
      
      {/* Modals */}
      <SummaryModal 
        open={showSummary}
        onOpenChange={setShowSummary}
        pdfKey={activePdfKey}
      />
      
      <MermaidModal 
        open={showMermaid}
        onOpenChange={setShowMermaid}
        pdfKey={activePdfKey}
      />
      
      <ApiTroubleshooter
        open={showApiTroubleshooter}
        onOpenChange={setShowApiTroubleshooter}
      />
    </div>
  );
};

export default MindMap;
