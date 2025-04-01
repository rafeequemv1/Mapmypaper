
import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>('');
  const [pdfWidth, setPdfWidth] = useState<number>(30); // Default PDF width percentage
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement | null>(null);
  
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

  // Apply PDF width when it changes
  useEffect(() => {
    const applyPdfWidth = () => {
      const pdfPanel = document.querySelector('.pdf-panel');
      if (pdfPanel && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const widthInPixels = Math.min(containerWidth * (pdfWidth / 100), containerWidth / 2);
        (pdfPanel as HTMLElement).style.width = `${widthInPixels}px`;
        
        // Update any relevant elements after width change
        window.dispatchEvent(new Event('resize'));
      }
    };
    
    applyPdfWidth();
    window.addEventListener('resize', applyPdfWidth);
    
    return () => {
      window.removeEventListener('resize', applyPdfWidth);
    };
  }, [pdfWidth]);

  const togglePdf = useCallback(() => {
    setShowPdf(prev => !prev);
  }, []);

  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);
  
  const toggleSummary = useCallback(() => {
    setShowSummary(prev => !prev);
  }, []);

  const toggleFlowchart = useCallback(() => {
    setShowFlowchart(prev => !prev);
  }, []);

  const handleExplainText = useCallback((text: string) => {
    setExplainText(text);
    if (!showChat) {
      setShowChat(true);
    }
  }, [showChat]);

  const handleMindMapReady = useCallback((mindMap: MindElixirInstance) => {
    // Set up the mind map instance with proper line breaks for nodes
    setMindMap(mindMap);
    
    // Function to apply line breaks to all nodes, especially the root
    const applyLineBreaksToNodes = () => {
      if (!mindMap.container) return;
      
      // Observer to watch for DOM changes and apply formatting
      const observer = new MutationObserver(() => {
        // Process the root node
        const rootNodeElement = mindMap.container.querySelector('.mind-elixir-root');
        if (rootNodeElement && rootNodeElement.textContent) {
          applyLineBreaksToNode(rootNodeElement, 3); // 3 words per line for root (reduced from 6)
        }
        
        // Process all topic nodes
        const topicElements = mindMap.container.querySelectorAll('.mind-elixir-topic');
        topicElements.forEach(topicElement => {
          if (topicElement.classList.contains('mind-elixir-root')) return; // Skip root, already handled
          applyLineBreaksToNode(topicElement as HTMLElement, 7); // 7 words per line for other nodes
        });

        // Verify all nodes have complete sentences
        const allNodes = mindMap.container.querySelectorAll('.mind-elixir-topic');
        allNodes.forEach(node => {
          const nodeText = node.textContent || '';
          
          // Add a period at the end if it doesn't have one and isn't empty
          if (nodeText && !nodeText.match(/[.!?]$/)) {
            // Only append periods to actual sentences, not just labels or titles
            if (nodeText.split(' ').length > 2) {
              let updatedText = nodeText;
              if (!nodeText.endsWith('.')) {
                updatedText += '.';
              }
              node.textContent = updatedText;
            }
          }
        });
      });
      
      // Apply line breaks to a specific node
      const applyLineBreaksToNode = (element: Element, wordsPerLine: number) => {
        if (!(element instanceof HTMLElement) || !element.textContent) return;
        
        const text = element.textContent;
        
        // For root node, make it shorter - extract only the title part
        if (element.classList.contains('mind-elixir-root')) {
          const titleText = text.split(/[.,;:]|(\n)/)[0].trim();
          const words = titleText.split(' ');
          
          let formattedText = '';
          for (let i = 0; i < words.length; i += wordsPerLine) {
            const chunk = words.slice(i, i + wordsPerLine).join(' ');
            formattedText += chunk + (i + wordsPerLine < words.length ? '<br>' : '');
          }
          
          element.innerHTML = formattedText;
          return;
        }
        
        // Regular nodes
        const words = text.split(' ');
        
        if (words.length <= wordsPerLine) return; // No need for line breaks
        
        let formattedText = '';
        for (let i = 0; i < words.length; i += wordsPerLine) {
          const chunk = words.slice(i, i + wordsPerLine).join(' ');
          formattedText += chunk + (i + wordsPerLine < words.length ? '<br>' : '');
        }
        
        element.innerHTML = formattedText;
      };
      
      // Start observing
      observer.observe(mindMap.container, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });
      
      // Initial formatting attempt
      setTimeout(() => {
        const rootNodeElement = mindMap.container.querySelector('.mind-elixir-root');
        if (rootNodeElement && rootNodeElement.textContent) {
          applyLineBreaksToNode(rootNodeElement, 3);
        }
      }, 100);
    };
    
    // Apply line breaks after a brief delay to ensure nodes are rendered
    setTimeout(applyLineBreaksToNodes, 200);
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

  return (
    <div ref={containerRef} className="h-screen flex flex-col overflow-hidden">
      {/* Header with all icons */}
      <Header 
        togglePdf={togglePdf}
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        setShowFlowchart={setShowFlowchart}
        setShowSequenceDiagram={() => {}} // Keep empty function but don't show sequence diagram
        setShowMindmap={() => {}} // Keep empty function but don't show mermaid mindmap
      />

      {/* PDF Width Slider */}
      {showPdf && pdfAvailable && (
        <div className="bg-gray-50 px-4 py-2 flex items-center space-x-4">
          <span className="text-xs text-gray-500 whitespace-nowrap">PDF Width:</span>
          <div className="w-40">
            <Slider
              min={15}
              max={50}
              step={1}
              value={[pdfWidth]}
              onValueChange={(value) => setPdfWidth(value[0])}
              className="w-full"
            />
          </div>
          <span className="text-xs text-gray-500">{pdfWidth}%</span>
        </div>
      )}

      {/* Main Content - Panels for PDF, MindMap, and Chat */}
      <div className="flex-1 overflow-hidden">
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

      {/* Flowchart Modal */}
      <FlowchartModal
        open={showFlowchart}
        onOpenChange={setShowFlowchart}
      />
    </div>
  );
};

export default MindMap;
