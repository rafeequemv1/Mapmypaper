
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
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false); // State to track capture status
  const [isCapturingInPdf, setIsCapturingInPdf] = useState(false); // New state to track if capture is happening in PDF

  const handleMindMapReady = useCallback((instance: MindElixirInstance) => {
    console.log("Mind map instance is ready:", instance);
    setIsMapGenerated(true);
    setMindMapInstance(instance);
    
    // Add event listener for node operations to enforce word limit per line
    instance.bus.addListener('operation', (operation: any) => {
      if (operation.name === 'editTopic') {
        const nodeObj = operation.obj;
        if (nodeObj && nodeObj.topic) {
          // Format node text to enforce 3-5 words per line
          const isRoot = nodeObj.id === 'root';
          const wordsPerLine = isRoot ? 3 : 4;
          
          // Format the node text after a short delay to allow the edit to complete
          setTimeout(() => {
            // Get the current node text after editing
            // Using type assertion (as any) to access methods not defined in the TypeScript interface
            const currentNode = (instance as any).findNodeObj(nodeObj.id);
            if (currentNode) {
              // Apply formatting rules
              const words = currentNode.topic.split(' ');
              if (words.length > wordsPerLine) {
                let formattedText = '';
                for (let i = 0; i < words.length; i += wordsPerLine) {
                  const chunk = words.slice(i, i + wordsPerLine).join(' ');
                  formattedText += chunk + (i + wordsPerLine < words.length ? '\n' : '');
                }
                
                // Update the node text with formatted version
                // Using type assertion (as any) to access methods not defined in the TypeScript interface
                (instance as any).updateNodeText(nodeObj.id, formattedText);
              }
            }
          }, 100);
        }
      }
    });
  }, []);

  // Handle text selected for explanation
  const handleExplainText = useCallback((text: string) => {
    setExplainText(text);
    // Always open chat when text is selected for explanation
    if (!showChat) {
      setShowChat(true);
      toast({
        title: "Explain Feature",
        description: "Opening chat to explain selected text.",
      });
    }
  }, [showChat, toast]);

  // Listen for capture errors from utils
  useEffect(() => {
    const handleCaptureError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.message) {
        toast({
          title: "Screenshot Error",
          description: customEvent.detail.message,
          variant: "destructive"
        });
        setCaptureError(customEvent.detail.message);
      }
    };
    
    window.addEventListener('captureError', handleCaptureError);
    
    return () => {
      window.removeEventListener('captureError', handleCaptureError);
    };
  }, [toast]);

  // Modified effect to track capture progress with PDF flag
  useEffect(() => {
    const handleCaptureProgress = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setIsCapturing(!!customEvent.detail.inProgress);
        
        // Only set the PDF capturing flag if specifically mentioned
        if (customEvent.detail.inPdf !== undefined) {
          setIsCapturingInPdf(!!customEvent.detail.inPdf);
        }
      }
    };
    
    window.addEventListener('captureInProgress', handleCaptureProgress);
    
    return () => {
      window.removeEventListener('captureInProgress', handleCaptureProgress);
    };
  }, []);

  // Listen for text selection events that should activate chat
  useEffect(() => {
    const handleTextSelected = (e: CustomEvent) => {
      if (e.detail?.text) {
        setExplainText(e.detail.text);
        // Always open chat panel
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

  // Enhanced effect to handle captured images and ensure chat opens
  useEffect(() => {
    const handleImageCaptured = (e: CustomEvent) => {
      // Always open chat when an image is captured
      if (!showChat) {
        setShowChat(true);
        toast({
          title: "Image Captured",
          description: "Opening chat with your selected area.",
        });
      }
    };
    
    window.addEventListener('openChatWithImage', handleImageCaptured as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithImage', handleImageCaptured as EventListener);
    };
  }, [showChat, toast]);

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
      />

      {/* Capture in progress indicator - ONLY SHOW IF NOT IN PDF */}
      {isCapturing && !isCapturingInPdf && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Capturing screenshot...</span>
        </div>
      )}

      {/* Display temporary message if a capture error occurs */}
      {captureError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 10.32 10.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Screenshot Error</p>
              <p className="text-sm">{captureError}</p>
            </div>
            <button 
              onClick={() => setCaptureError(null)} 
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;
