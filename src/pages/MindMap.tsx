
import { useState, useEffect } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  useEffect(() => {
    // Check for PDF data immediately when component mounts
    const checkPdfAvailability = () => {
      try {
        // Check if PDF data exists in either storage key
        const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
        const hasPdfData = !!pdfData;
        
        console.log("PDF check on mount - available:", hasPdfData, "PDF data length:", pdfData ? pdfData.length : 0);
        
        setPdfAvailable(hasPdfData);
        
        // Only show PDF if data is available
        if (hasPdfData) {
          setShowPdf(true);
        }
        
        // Ensure PDF data is stored with the consistent key name
        if (sessionStorage.getItem('uploadedPdfData') && !sessionStorage.getItem('pdfData')) {
          sessionStorage.setItem('pdfData', sessionStorage.getItem('uploadedPdfData')!);
        }
      } catch (error) {
        console.error("Error checking PDF availability:", error);
        setPdfAvailable(false);
      }
    };
    
    // Execute PDF check immediately
    checkPdfAvailability();
  }, []);

  const togglePdf = () => {
    setShowPdf(prev => !prev);
  };

  const toggleChat = () => {
    setShowChat(prev => !prev);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header component with navigation and toggles */}
      <Header 
        showPdf={showPdf}
        togglePdf={togglePdf}
        pdfAvailable={pdfAvailable}
        showChat={showChat}
        toggleChat={toggleChat}
      />

      {/* Main Content - Panels for PDF, MindMap, and Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PanelStructure 
          showPdf={showPdf && pdfAvailable}
          showChat={showChat}
          toggleChat={toggleChat}
          togglePdf={togglePdf}
        />
      </div>
    </div>
  );
};

export default MindMap;
