
import { useState, useEffect } from "react";
import { Brain, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import MindMapViewer from "@/components/MindMapViewer";

const Index = () => {
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [pdfTextLoaded, setPdfTextLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have extracted PDF text
    const extractedText = localStorage.getItem('extractedPdfText');
    setPdfTextLoaded(!!extractedText);
    
    // Set a small delay before generating the map to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsMapGenerated(true);
      
      // Show toast when mind map is ready
      toast({
        title: "Mindmap loaded",
        description: extractedText 
          ? "Your PDF text has been loaded for mind mapping. Right-click on nodes to access the node menu with options."
          : "Your mindmap is ready to use. Right-click on nodes to access the node menu with options."
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Header - thin and black */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white">PaperMind</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
            <Link to="/upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              <span>Upload PDF</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content - Made fullscreen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {pdfTextLoaded && (
          <div className="bg-green-50 px-4 py-2 border-b border-green-200 flex justify-center items-center">
            <FileText className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-sm text-green-800">PDF text loaded and ready for mind mapping</p>
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {/* Mind Elixir Mindmap */}
          <MindMapViewer isMapGenerated={isMapGenerated} />
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

export default Index;
