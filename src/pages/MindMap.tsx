
import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import MermaidMindmapModal from "@/components/mindmap/MermaidMindmapModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import TreemapModal from "@/components/mindmap/TreemapModal";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showMermaidMindmap, setShowMermaidMindmap] = useState(false);
  const [showTreemap, setShowTreemap] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>('');
  const [pdfImagesExtracted, setPdfImagesExtracted] = useState(false);
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
  
  const toggleMermaidMindmap = useCallback(() => {
    setShowMermaidMindmap(prev => !prev);
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
          applyLineBreaksToNode(topicElement as HTMLElement, 5); // 5 words per line as requested
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
    
    // Check for PDF images
    const checkForPdfImages = async () => {
      try {
        const pdfDataUrl = sessionStorage.getItem("pdfData");
        if (pdfDataUrl) {
          // Load pdfjs dynamically
          const pdfjs = await import('pdfjs-dist');
          // Set worker path explicitly with HTTPS URL that matches the exact version
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          
          const pdfData = atob(pdfDataUrl.split(',')[1]);
          const loadingTask = pdfjs.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          
          // Just check first page for images to quickly determine if extraction is worthwhile
          const page = await pdf.getPage(1);
          const operatorList = await page.getOperatorList();
          
          let hasImages = false;
          for (let i = 0; i < operatorList.fnArray.length; i++) {
            if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
              hasImages = true;
              break;
            }
          }
          
          if (hasImages) {
            setPdfImagesExtracted(true);
            toast({
              title: "Images Available",
              description: "This PDF contains images that can be intelligently placed in your mind map based on content analysis.",
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error("Error checking for PDF images:", error);
      }
    };
    
    checkForPdfImages();
  }, [toast]);

  const handleExportMindMap = useCallback(async () => {
    if (!mindMap) {
      toast({
        title: "Export Failed",
        description: "The mind map is not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Only export SVG
      const blob = mindMap.exportSvg();

      if (!blob) {
        throw new Error("Failed to generate export data");
      }

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap.svg`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your mind map has been exported as SVG."
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
        setShowMermaidMindmap={setShowMermaidMindmap}
        isPdfActive={showPdf && pdfAvailable}
        isChatActive={showChat}
        onExportMindMap={handleExportMindMap}
      />

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
      
      {/* Modals */}
      <SummaryModal
        open={showSummary}
        onOpenChange={setShowSummary}
      />

      <FlowchartModal
        open={showFlowchart}
        onOpenChange={setShowFlowchart}
      />

      <MermaidMindmapModal
        open={showMermaidMindmap}
        onOpenChange={setShowMermaidMindmap}
      />
      
      <TreemapModal 
        open={showTreemap}
        onOpenChange={setShowTreemap}
      />
    </div>
  );
};

export default MindMap;
