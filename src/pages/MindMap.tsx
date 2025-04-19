import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";
import { retrievePDF } from "@/utils/pdfStorage";
import { Loader } from "lucide-react";

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>('');
  const { toast } = useToast();
  const [textExplainProcessed, setTextExplainProcessed] = useState(false);
  const [pdfLoadAttempted, setPdfLoadAttempted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // Check for PDF data immediately when component mounts
    const checkPdfAvailability = async () => {
      try {
        setIsLoading(true);
        // Check if PDF data exists using our utility function that checks both IndexedDB and sessionStorage
        const pdfData = await retrievePDF();
        const hasPdfData = !!pdfData;
        
        console.log("PDF check on mount - available:", hasPdfData, "PDF data length:", pdfData ? pdfData.length : 0);
        
        setPdfAvailable(hasPdfData);
        setPdfLoadAttempted(true);
        
        if (!hasPdfData) {
          // If no PDF is found, show a toast notification
          toast({
            title: "PDF Not Found",
            description: "Please upload a PDF document first",
            variant: "destructive",
          });
          // Redirect to upload page if no PDF data is available
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
        
        // Keep PDF panel visible if data is available
        setShowPdf(hasPdfData);
      } catch (error) {
        console.error("Error checking PDF availability:", error);
        setPdfAvailable(false);
        setShowPdf(false);
        setPdfLoadAttempted(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Execute PDF check immediately
    checkPdfAvailability();
  }, [toast]);

  const togglePdf = useCallback(() => {
    console.log("Toggle PDF clicked. Current state:", showPdf);
    
    // Only toggle if PDF is available
    if (pdfAvailable) {
      setShowPdf(prev => !prev);
    } else {
      toast({
        title: "No PDF Found",
        description: "Please upload a PDF document first",
        variant: "destructive",
      });
    }
  }, [showPdf, pdfAvailable, toast]);

  const toggleChat = useCallback(() => {
    setShowChat(prev => !prev);
  }, []);
  
  const toggleSummary = useCallback(() => {
    setShowSummary(prev => !prev);
  }, []);

  const handleExplainText = useCallback((text: string) => {
    // Prevent duplicate text explanation
    if (textExplainProcessed && text === explainText) {
      return;
    }
    
    setExplainText(text);
    setTextExplainProcessed(true);
    
    // Set a timeout to reset the flag after a short period
    setTimeout(() => {
      setTextExplainProcessed(false);
    }, 500);
    
    if (!showChat) {
      setShowChat(true);
    }
  }, [showChat, explainText, textExplainProcessed]);

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
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">Loading your document...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col overflow-hidden">
      {/* Header with all icons */}
      <Header 
        togglePdf={togglePdf}
        toggleChat={toggleChat}
        setShowSummary={setShowSummary}
        isPdfActive={showPdf && pdfAvailable}
        isChatActive={showChat}
        mindMap={mindMap}
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
    </div>
  );
};

export default MindMap;
