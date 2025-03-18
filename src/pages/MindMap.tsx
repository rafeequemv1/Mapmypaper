
import { useState, useEffect } from "react";
import { Brain, ArrowLeft, FileText, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
import ChatBox from "@/components/ChatBox";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";

const MindMap = () => {
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Mind Map");
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
        setShowPdf(hasPdfData);
        
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
    
    // Set a small delay before generating the map to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMapGenerated(true);
      
      try {
        // Get the generated mind map data to extract the title
        const savedData = sessionStorage.getItem('mindMapData');
        if (savedData) {
          const data = JSON.parse(savedData);
          if (data.nodeData && data.nodeData.topic) {
            setTitle(data.nodeData.topic);
          }
        }
      } catch (error) {
        console.error("Error parsing mind map data for title:", error);
      }
      
      // Show toast when mind map is ready
      toast({
        title: "Mindmap loaded",
        description: "Your mindmap is ready to use. Right-click on nodes for options.",
        position: "bottom-left"
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [toast]);

  const handleBack = () => {
    navigate("/");
  };

  const togglePdf = () => {
    setShowPdf(prev => !prev);
  };

  const toggleChat = () => {
    setShowChat(prev => !prev);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar with controls */}
      <div className="py-2 px-4 border-b bg-[#222222] flex items-center">
        <div className="flex items-center gap-2 w-1/3">
          <Brain className="h-5 w-5 text-white" />
          <h1 className="text-base font-medium text-white">PaperMind</h1>
          
          <Button variant="ghost" size="sm" className="text-white ml-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
        
        {/* Centered chat button */}
        <div className="flex items-center justify-center w-1/3">
          <Toggle 
            pressed={showChat} 
            onPressedChange={toggleChat}
            aria-label="Toggle research assistant"
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <Brain className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Research Assistant</span>
          </Toggle>
        </div>
        
        {/* PDF toggle on the right */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          {pdfAvailable && (
            <Toggle 
              pressed={showPdf} 
              onPressedChange={togglePdf}
              aria-label="Toggle PDF view"
              className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">PDF</span>
            </Toggle>
          )}
        </div>
      </div>

      {/* Main Content - Flex-grow to take available space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Resizable panels for PDF, Mind Map, and Chat */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {showPdf && (
            <>
              <ResizablePanel defaultSize={25} minSize={20} id="pdf-panel">
                <PdfViewer />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel defaultSize={showChat ? 50 : (showPdf ? 75 : 100)} id="mindmap-panel">
            <MindMapViewer isMapGenerated={isMapGenerated} />
          </ResizablePanel>
          {showChat && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} id="chat-panel">
                <div className="flex flex-col h-full">
                  {/* Chat panel header with controls */}
                  <div className="flex items-center justify-between p-2 border-b bg-secondary/30">
                    <h3 className="font-medium">Research Assistant</h3>
                    <div className="flex items-center gap-2">
                      {pdfAvailable && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-muted-foreground hover:text-foreground" 
                          onClick={togglePdf}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {showPdf ? "Hide PDF" : "Show PDF"}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={toggleChat}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <ChatBox />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default MindMap;
