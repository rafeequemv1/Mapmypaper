
import { useState, useEffect } from "react";
import { Brain, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import MindMapViewer from "@/components/MindMapViewer";
import PdfViewer from "@/components/PdfViewer";
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

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Header - thin and black */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white">PaperMind</h1>
          </div>
          <div className="flex items-center gap-2">
            {pdfAvailable && (
              <Toggle 
                pressed={showPdf} 
                onPressedChange={togglePdf}
                aria-label="Toggle PDF view"
                className="text-white"
              >
                <FileText className="h-4 w-4" />
                <span className="ml-1 text-sm">PDF</span>
              </Toggle>
            )}
            <Button variant="ghost" size="sm" className="text-white" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Upload
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Made fullscreen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-2 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-medium truncate">{title}</h2>
            <p className="text-sm text-muted-foreground">AI-generated mind map from your PDF</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {/* Resizable panels for PDF and Mind Map */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {showPdf && pdfAvailable && (
              <>
                <ResizablePanel defaultSize={30} minSize={25}>
                  <PdfViewer />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel defaultSize={showPdf && pdfAvailable ? 70 : 100}>
              <MindMapViewer isMapGenerated={isMapGenerated} />
            </ResizablePanel>
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
