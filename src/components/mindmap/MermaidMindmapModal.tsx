
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw, Download, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import { generateMindmapFromPdf } from "@/services/geminiService";

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const [showSyntax, setShowSyntax] = useState(false); // Toggle for showing syntax code
  const { toast } = useToast();
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap code when modal is opened
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Creating a mindmap visualization from your document...",
      });
      
      // Get PDF content from the Gemini API
      generateMindmapFromPdf()
        .then((mindmapCode) => {
          if (mindmapCode) {
            setMermaidCode(mindmapCode);
            toast({
              title: "Mindmap Generated",
              description: "Your mindmap has been successfully generated"
            });
          } else {
            throw new Error("Failed to generate mindmap");
          }
        })
        .catch((error) => {
          console.error("Error generating mindmap:", error);
          toast({
            title: "Error",
            description: "Failed to generate mindmap. Using default structure.",
            variant: "destructive"
          });
          // Set default mindmap on failure
          setMermaidCode(`mindmap
  root((Document Overview))
    Document Structure
      Introduction
      Methodology
      Results
      Discussion
      Conclusion
    Key Concepts
      Concept 1
      Concept 2
      Concept 3
    Supporting Evidence
      Data Points
      Citations
      Analysis`);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [open, toast]);

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Toggle syntax view
  const toggleSyntaxView = () => {
    setShowSyntax(prev => !prev);
  };

  // Handle export as PNG
  const handleExportAsPNG = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current);
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'mermaid-mindmap.png';
      link.click();
      
      toast({
        title: "Export successful",
        description: "Mermaid mindmap exported as PNG"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export mindmap",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap using Mermaid.
          </DialogDescription>
        </DialogHeader>
        
        {/* Toolbar with zoom controls and syntax toggle */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="flex items-center gap-1"
            title="Reset zoom"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center gap-1"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSyntaxView}
            className="flex items-center gap-1 ml-auto"
          >
            <Code className="h-4 w-4 mr-1" />
            {showSyntax ? "Hide Syntax" : "Show Syntax"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportAsPNG}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>
        </div>
        
        {/* Mindmap Preview or Syntax View */}
        <div className="flex-1 overflow-auto bg-white rounded-md p-4 border">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Generating mindmap...</p>
              </div>
            </div>
          ) : showSyntax ? (
            // Syntax code view
            <div className="h-full w-full bg-gray-50 rounded overflow-auto p-4">
              <pre className="text-sm font-mono">{mermaidCode}</pre>
            </div>
          ) : (
            // Mindmap preview
            <div 
              ref={previewRef} 
              className="min-h-full h-full w-full flex items-center justify-center overflow-hidden"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <div className="mermaid bg-white p-6 rounded-lg w-full h-full flex items-center justify-center">
                {mermaidCode}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindmapModal;
