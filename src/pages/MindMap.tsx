
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
        
        // Check if PDF data exists in either storage key
        const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
        setPdfAvailable(!!pdfData);
        setShowPdf(!!pdfData);

        console.log("PDF available:", !!pdfData, "PDF data length:", pdfData ? pdfData.length : 0);
        
        // Ensure PDF data is also stored with the consistent key name
        if (sessionStorage.getItem('uploadedPdfData') && !sessionStorage.getItem('pdfData')) {
          sessionStorage.setItem('pdfData', sessionStorage.getItem('uploadedPdfData')!);
        }
      } catch (error) {
        console.error("Error parsing mind map data for title:", error);
      }
      
      // Show toast when mind map is ready
      toast({
        title: "Mindmap loaded",
        description: "Your mindmap is ready to use. Right-click on nodes for options."
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
      {/* Simple top bar with title and controls */}
      <div className="py-2 px-4 border-b bg-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-white" />
          <h1 className="text-base font-medium text-white">PaperMind</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-white" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
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
          
          <Toggle 
            pressed={showChat} 
            onPressedChange={toggleChat}
            aria-label="Toggle chat"
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Chat</span>
          </Toggle>
        </div>
      </div>

      {/* Main Content - Flex-grow to take available space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Resizable panels for PDF, Mind Map, and Chat */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {showPdf && (
            <>
              <ResizablePanel defaultSize={25} minSize={20}>
                <PdfViewer />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel defaultSize={showChat ? 50 : (showPdf ? 75 : 100)}>
            <MindMapViewer isMapGenerated={isMapGenerated} />
          </ResizablePanel>
          {showChat && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="flex flex-col h-full">
                  {/* Chat panel header with controls */}
                  <div className="flex items-center justify-between p-2 border-b bg-secondary/30">
                    <h3 className="font-medium">AI Chat Assistant</h3>
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
