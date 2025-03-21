
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateMindMapFromText } from "@/services/geminiService";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>("");
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
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
            sessionStorage.setItem('pdfText', mindmapData.pdf_data);
            sessionStorage.setItem('pdfFileName', mindmapData.pdf_filename);
            
            // Store the mindmap data in sessionStorage
            if (mindmapData.mindmap_data) {
              sessionStorage.setItem('mindMapData', JSON.stringify(mindmapData.mindmap_data));
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
        const pdfText = sessionStorage.getItem('pdfText');
        const pdfUrl = sessionStorage.getItem('pdfUrl');
        const hasPdfData = !!(pdfText || pdfUrl);
        
        console.log("PDF check on mount - available:", hasPdfData);
        
        setPdfAvailable(hasPdfData);
        setShowPdf(hasPdfData);
        
        // If we have PDF data but no mindmap data, generate it
        const mindMapData = sessionStorage.getItem('mindMapData');
        if (hasPdfData && !mindMapData && !isGeneratingMindMap) {
          generateMindMapData();
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

  // Function to generate mind map data from PDF text
  const generateMindMapData = async () => {
    try {
      setIsGeneratingMindMap(true);
      
      const pdfText = sessionStorage.getItem('pdfText');
      if (!pdfText) {
        toast({
          title: "Error",
          description: "No PDF text available to generate mindmap",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Generating Mind Map",
        description: "Please wait while we analyze your PDF..."
      });
      
      await generateMindMapFromText(pdfText);
      
      toast({
        title: "Success",
        description: "Mind map generated successfully!"
      });
      
      // Force reload the page to show the new mind map
      window.location.reload();
      
    } catch (error) {
      console.error("Error generating mind map data:", error);
      toast({
        title: "Error",
        description: "Failed to generate mind map from PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

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
    
    // Fix: The mind-elixir library doesn't have an 'on' method directly on the instance
    // Instead, we need to check if mind-elixir dispatches custom events to the container
    if (mindMap && mindMap.container) {
      const container = mindMap.container as HTMLElement;
      
      // Define our handler function
      const handleOperation = () => {
        console.log('Mind map operation detected, saving data...');
        saveMindMapData();
      };
      
      // Listen for various events that might indicate a change in the mind map
      // The 'operation' event is a custom event that mind-elixir might dispatch
      container.addEventListener('operation', handleOperation);
      
      // Additionally, listen for more standard mutation events
      container.addEventListener('nodeclick', handleOperation);
      container.addEventListener('mtop-select', handleOperation); // Menu operations
      container.addEventListener('editNodeEnd', handleOperation); // When editing node text completes
      
      return () => {
        // Clean up event listeners
        container.removeEventListener('operation', handleOperation);
        container.removeEventListener('nodeclick', handleOperation);
        container.removeEventListener('mtop-select', handleOperation);
        container.removeEventListener('editNodeEnd', handleOperation);
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

      {isGeneratingMindMap ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Generating Mind Map</h2>
            <p className="text-gray-600">Analyzing your PDF and creating a visual knowledge map...</p>
          </div>
        </div>
      ) : (
        /* Main Content - Panels for PDF, MindMap, and Chat */
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
      )}
      
      {/* Summary Modal */}
      <SummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
      />
    </div>
  );
};

export default MindMap;
