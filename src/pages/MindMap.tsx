
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { MindMapTheme, mindMapThemes } from "@/components/mindmap/ThemeSelect";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [currentTheme, setCurrentTheme] = useState<MindMapTheme>('green'); // Default theme
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for PDF data immediately when component mounts
    const checkPdfAvailability = () => {
      try {
        // Check if PDF data exists in either storage key
        const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
        const hasPdfData = !!pdfData;
        
        console.log("PDF check on mount - available:", hasPdfData, "PDF data length:", pdfData ? pdfData.length : 0);
        
        setPdfAvailable(hasPdfData);
        
        // Keep PDF panel visible if data is available
        setShowPdf(hasPdfData);
        
        // Ensure PDF data is stored with the consistent key name
        if (sessionStorage.getItem('uploadedPdfData') && !sessionStorage.getItem('pdfData')) {
          sessionStorage.setItem('pdfData', sessionStorage.getItem('uploadedPdfData')!);
        }
      } catch (error) {
        console.error("Error checking PDF availability:", error);
        setPdfAvailable(false);
        setShowPdf(false);
      }
    };
    
    // Execute PDF check immediately
    checkPdfAvailability();
  }, [toast]);

  // Load the last selected theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem('mindMapTheme');
    if (savedTheme && Object.keys(mindMapThemes).includes(savedTheme)) {
      try {
        setCurrentTheme(savedTheme as MindMapTheme);
      } catch (error) {
        console.error("Error loading saved theme:", error);
      }
    }
  }, []);

  const togglePdf = () => {
    setShowPdf(prev => !prev);
  };

  const toggleChat = () => {
    setShowChat(prev => !prev);
  };
  
  const toggleSummary = () => {
    setShowSummary(prev => !prev);
  };

  const handleMindMapReady = useCallback((mindMap: MindElixirInstance) => {
    setMindMap(mindMap);
  }, []);

  const handleExportMindMap = useCallback(async (type: 'svg' | 'png') => {
    if (!mindMap) {
      toast({
        title: "Export Failed",
        description: "The mind map is not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      let blob;
      
      if (type === 'svg') {
        blob = mindMap.exportSvg();
      } else if (type === 'png') {
        blob = await mindMap.exportPng();
      }

      if (!blob) {
        throw new Error("Failed to generate export data");
      }

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap.${type}`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Your mind map has been exported as ${type.toUpperCase()}.`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the mind map: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }, [mindMap, toast]);

  const handleThemeChange = useCallback((theme: MindMapTheme) => {
    setCurrentTheme(theme);
    
    // Save the theme preference to localStorage
    localStorage.setItem('mindMapTheme', theme);
    
    toast({
      title: "Theme Changed",
      description: `Mind map theme updated to ${theme}.`,
      duration: 2000,
    });
  }, [toast]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header component with navigation and toggles */}
      <Header 
        showPdf={showPdf}
        togglePdf={togglePdf}
        pdfAvailable={pdfAvailable}
        showChat={showChat}
        toggleChat={toggleChat}
        onExportMindMap={handleExportMindMap}
        onOpenSummary={toggleSummary}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content - Panels for PDF, MindMap, and Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PanelStructure 
          showPdf={showPdf && pdfAvailable}
          showChat={showChat}
          toggleChat={toggleChat}
          togglePdf={togglePdf}
          onMindMapReady={handleMindMapReady}
          theme={currentTheme}
        />
      </div>
      
      {/* Summary Modal */}
      <SummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
      />
    </div>
  );
};

export default MindMap;
