
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    // Check for PDF data immediately when component mounts
    const checkPdfAvailability = async () => {
      try {
        // First check URL parameters for a mindmap ID
        const urlParams = new URLSearchParams(window.location.search);
        const mindmapId = urlParams.get('id');
        
        if (mindmapId && user) {
          // If we have a mindmap ID, try to load it from the database
          const { data: mindmapData, error } = await supabase
            .from('user_mindmaps')
            .select('pdf_data, pdf_filename, mindmap_data')
            .eq('id', mindmapId)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error) {
            console.error("Error fetching mindmap:", error);
            toast({
              title: "Error",
              description: "Failed to load saved mindmap",
              variant: "destructive"
            });
          } else if (mindmapData) {
            // Store the PDF data and filename in sessionStorage
            sessionStorage.setItem('pdfData', mindmapData.pdf_data);
            sessionStorage.setItem('pdfFileName', mindmapData.pdf_filename);
            
            // Store the mindmap data in sessionStorage
            if (mindmapData.mindmap_data) {
              sessionStorage.setItem('mindmapData', JSON.stringify(mindmapData.mindmap_data));
            }
            
            setPdfAvailable(true);
            setShowPdf(true);
            
            toast({
              title: "Success",
              description: "Loaded saved mindmap"
            });
            return;
          }
        }
        
        // If no mindmap ID or couldn't load from database, check sessionStorage
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
  }, [toast, user]);

  const togglePdf = () => {
    setShowPdf(prev => !prev);
  };

  const toggleChat = () => {
    setShowChat(prev => !prev);
  };
  
  const toggleSummary = () => {
    setShowSummary(prev => !prev);
  };

  const handleExplainText = useCallback((text: string) => {
    setExplainText(text);
    if (!showChat) {
      setShowChat(true);
    }
  }, [showChat]);

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

  // Save mindmap data when it changes
  useEffect(() => {
    const saveMindMapData = async () => {
      if (!mindMap || !user) return;
      
      try {
        const pdfFilename = sessionStorage.getItem('pdfFileName');
        if (!pdfFilename) return;
        
        // Get the mind map data
        const mindmapData = mindMap.getData();
        
        // Check if this PDF already has a record
        const { data: existingMindmap, error } = await supabase
          .from('user_mindmaps')
          .select('id')
          .eq('user_id', user.id)
          .eq('pdf_filename', pdfFilename)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking for existing mindmap:', error);
          return;
        }
        
        if (existingMindmap) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_mindmaps')
            .update({
              mindmap_data: mindmapData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMindmap.id);
            
          if (updateError) {
            console.error('Error updating mindmap data:', updateError);
          } else {
            console.log('Mindmap data saved successfully');
          }
        }
      } catch (error) {
        console.error('Error saving mindmap data:', error);
      }
    };
    
    // Add event listener for operation events
    if (mindMap) {
      // Fix: Use the appropriate event handling method
      // Instead of using mindMap.on, we'll use a different approach
      
      // Create a separate function that we can add and remove as an event listener
      const handleOperation = () => {
        saveMindMapData();
      };
      
      // Store the handler reference in a data attribute for cleanup
      const container = mindMap.container as HTMLElement;
      if (container) {
        container.dataset.operationHandler = 'true';
        container.addEventListener('operation', handleOperation);
      }
      
      return () => {
        // Clean up event listener
        if (container) {
          container.removeEventListener('operation', handleOperation);
          delete container.dataset.operationHandler;
        }
      };
    }
  }, [mindMap, user]);

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
      />

      {/* Main Content - Panels for PDF, MindMap, and Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PanelStructure 
          showPdf={showPdf && pdfAvailable}
          showChat={showChat}
          toggleChat={toggleChat}
          togglePdf={togglePdf}
          onMindMapReady={handleMindMapReady}
          explainText={explainText}
          onExplainText={handleExplainText}
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
