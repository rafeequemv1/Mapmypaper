
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { Download } from "lucide-react";
import mermaid from "mermaid";

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const [mindmapCode, setMindmapCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [uniqueId, setUniqueId] = useState(`mindmap-${Date.now()}`);
  const { toast } = useToast();

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      mindmap: {
        padding: 16,
        useMaxWidth: true
      }
    });
  }, []);

  // Generate mindmap when modal opens
  useEffect(() => {
    if (open) {
      generateMindmap();
    } else {
      // Reset state when closing
      setIsRendered(false);
    }
  }, [open]);

  // Render mindmap whenever code changes
  useEffect(() => {
    if (mindmapCode && open) {
      try {
        // Generate a new unique ID each time to avoid caching issues
        setUniqueId(`mindmap-${Date.now()}`);
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(uniqueId);
          if (element) {
            mermaid.render(uniqueId, mindmapCode)
              .then(({ svg }) => {
                element.innerHTML = svg;
                setIsRendered(true);
              })
              .catch(error => {
                console.error("Mermaid rendering error:", error);
                toast({
                  title: "Rendering Error",
                  description: "Failed to render the mindmap",
                  variant: "destructive"
                });
              });
          }
        }, 200);
      } catch (error) {
        console.error("Mermaid processing error:", error);
      }
    }
  }, [mindmapCode, uniqueId, open, toast]);

  // Generate the mindmap using Gemini API
  const generateMindmap = async () => {
    setIsLoading(true);
    try {
      const mindmap = await generateMindmapFromPdf();
      setMindmapCode(mindmap);
    } catch (error) {
      console.error("Error generating mindmap:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate mindmap from the PDF",
        variant: "destructive"
      });
      setMindmapCode(`mindmap\n  root((Error))\n    Failed to generate mindmap\n      Please try again`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export the mindmap as SVG
  const exportAsSVG = () => {
    const svgElement = document.querySelector("#" + uniqueId + " svg");
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = "mindmap.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      
      toast({
        title: "Export successful",
        description: "Mermaid mindmap exported as SVG"
      });
    } else {
      toast({
        title: "Export failed",
        description: "Mindmap is not available for export",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex justify-between items-center flex-row">
          <DialogTitle>Document Mindmap</DialogTitle>
          <Button onClick={exportAsSVG} variant="outline" size="sm" className="ml-auto flex gap-2 items-center">
            <Download className="h-4 w-4" /> Export SVG
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              id={uniqueId} 
              className="mermaid-mindmap w-full h-full min-h-[500px] flex justify-center items-center overflow-auto"
              style={{ zoom: 1 }}
            >
              {!isRendered && (
                <div className="text-gray-500">Rendering mindmap...</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindmapModal;
