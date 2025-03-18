
import { useState, useEffect } from "react";
import { Brain, ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
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
        
        // Check if PDF data exists
        const pdfData = sessionStorage.getItem('pdfData');
        setPdfAvailable(!!pdfData);
        setShowPdf(!!pdfData);

        console.log("PDF available:", !!pdfData); // Debug log
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
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Header - thin and black */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center">
          <div className="flex items-center gap-2 w-1/3">
            <Brain className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white">PaperMind</h1>
          </div>
          
          {/* Center section for toggles */}
          <div className="flex items-center justify-center gap-4 w-1/3">
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
          
          {/* Right section for back button */}
          <div className="flex items-center justify-end w-1/3">
            <Button variant="ghost" size="sm" className="text-white" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Upload
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-2 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-medium truncate">{title}</h2>
            <p className="text-sm text-muted-foreground">AI-generated mind map from your PDF</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {/* Resizable panels for PDF, Mind Map, and Chat */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {showPdf && pdfAvailable && (
              <>
                <ResizablePanel defaultSize={25} minSize={20}>
                  <PdfViewer />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel defaultSize={showChat ? 50 : (showPdf && pdfAvailable ? 75 : 100)}>
              <MindMapViewer isMapGenerated={isMapGenerated} />
            </ResizablePanel>
            {showChat && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={20}>
                  <div className="flex flex-col h-full">
                    {/* Add PDF toggle button in chat panel header */}
                    {pdfAvailable && (
                      <div className="flex items-center justify-end p-2 border-b">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground" 
                          onClick={togglePdf}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {showPdf ? "Hide PDF" : "Show PDF"}
                        </Button>
                      </div>
                    )}
                    <div className="flex-1">
                      <ChatBox />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 px-8 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              PaperMind Mapper — Transform research into visual knowledge
            </p>
            <Separator className="md:hidden" />
            <div className="text-sm text-muted-foreground">
              © 2023 PaperMind
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MindMap;
