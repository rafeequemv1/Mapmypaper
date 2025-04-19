
import { useState, useEffect, useCallback, useRef, ErrorBoundary } from "react";
import Header from "@/components/mindmap/Header";
import PanelStructure from "@/components/mindmap/PanelStructure";
import SummaryModal from "@/components/mindmap/SummaryModal";
import FlowchartModal from "@/components/mindmap/FlowchartModal";
import { MindmapModal } from "@/components/mindmap/MindmapModal";
import { MindElixirInstance } from "mind-elixir";
import { useToast } from "@/hooks/use-toast";

// Error Boundary Component
class MindMapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MindMap error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">There was a problem rendering the mind map.</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MindMap = () => {
  const [showPdf, setShowPdf] = useState(true); // Always show PDF by default
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  const [explainText, setExplainText] = useState<string>('');
  const { toast } = useToast();
  const [textExplainProcessed, setTextExplainProcessed] = useState(false);
  const [isRendering, setIsRendering] = useState(true);

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
    
    // Add delayed rendering to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsRendering(false);
    }, 200);
    
    return () => {
      clearTimeout(timer);
      // Clean up any potential lingering elements
      if (mindMap && mindMap.container) {
        try {
          mindMap.container.innerHTML = '';
        } catch (e) {
          console.error("Error cleaning up mind map:", e);
        }
      }
    };
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
  
  const toggleMindmap = useCallback(() => {
    setShowMindmap(prev => !prev);
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
      if (!mindMap || !mindMap.container) return;
      
      try {
        // Observer to watch for DOM changes and apply formatting
        const observer = new MutationObserver(() => {
          try {
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
          } catch (error) {
            console.error("Error modifying mind map nodes:", error);
          }
        });
        
        // Apply line breaks to a specific node
        const applyLineBreaksToNode = (element: Element, wordsPerLine: number) => {
          try {
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
          } catch (error) {
            console.error("Error applying line breaks:", error);
          }
        };
        
        try {
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
        } catch (error) {
          console.error("Error setting up observer:", error);
        }
        
      } catch (error) {
        console.error("Error in applyLineBreaksToNodes:", error);
      }
    };
    
    // Apply line breaks after a brief delay to ensure nodes are rendered
    setTimeout(() => {
      try {
        applyLineBreaksToNodes();
      } catch (error) {
        console.error("Error applying line breaks after timeout:", error);
      }
    }, 200);
  }, []);

  // Show loading state during initial rendering to prevent DOM manipulation conflicts
  if (isRendering) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading mind map...</div>
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
        setShowFlowchart={setShowFlowchart}
        setShowMindmap={setShowMindmap}
        isPdfActive={showPdf && pdfAvailable}
        isChatActive={showChat}
        mindMap={mindMap}
      />

      {/* Main Content - Panels for PDF, MindMap, and Chat */}
      <div className="flex-1 overflow-hidden">
        <MindMapErrorBoundary>
          <PanelStructure 
            showPdf={showPdf && pdfAvailable}
            showChat={showChat}
            toggleChat={toggleChat}
            togglePdf={togglePdf}
            onMindMapReady={handleMindMapReady}
            explainText={explainText}
            onExplainText={handleExplainText}
          />
        </MindMapErrorBoundary>
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
      
      <MindmapModal 
        isOpen={showMindmap}
        onClose={() => setShowMindmap(false)}
      />
    </div>
  );
};

export default MindMap;
