
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
import { ZoomIn, ZoomOut, RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import { generateMindmapFromText } from "@/services/geminiService";

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const { toast } = useToast();
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap code when modal is opened using Gemini
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Get PDF content from session storage to generate mindmap structure
      const pdfText = sessionStorage.getItem("pdfText");
      
      if (!pdfText || pdfText.length < 100) {
        toast({
          title: "PDF Content Missing",
          description: "Please upload a PDF document first for analysis.",
          variant: "destructive"
        });
        setIsGenerating(false);
        
        // Set a simple placeholder
        setMermaidCode(`mindmap
  root((No PDF Content))
    Upload a PDF
      To analyze content
      And generate mindmap`);
        return;
      }
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Analyzing your document and creating a mindmap visualization...",
      });
      
      // Use Gemini AI to analyze the PDF and generate a mindmap
      generateMindmapFromText(pdfText)
        .then((result) => {
          if (result && result.code) {
            // The Gemini service returns properly formatted mindmap code
            setMermaidCode(result.code);
          } else {
            throw new Error("Failed to generate mindmap from PDF");
          }
        })
        .catch((error) => {
          console.error("Failed to generate mindmap:", error);
          toast({
            title: "Generation Failed",
            description: "Could not create mindmap from PDF. Please try again.",
            variant: "destructive"
          });
          
          // Set a basic fallback mindmap
          setMermaidCode(`mindmap
  root((Document Analysis))
    Error Generating Content
      Please try again
      Or check PDF content`);
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dataUrl);
      
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
        
        {/* Zoom controls */}
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
            onClick={handleExportAsPNG}
            className="ml-auto flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>
        </div>
        
        {/* Mindmap Preview */}
        <div className="flex-1 overflow-auto bg-white rounded-md p-4 border">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Generating mindmap from your document...</p>
              </div>
            </div>
          ) : (
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
