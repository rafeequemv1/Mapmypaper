
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
        const newId = `mindmap-${Date.now()}`;
        setUniqueId(newId);
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(newId);
          if (element) {
            mermaid.render(newId, mindmapCode)
              .then(({ svg }) => {
                element.innerHTML = svg;
                setIsRendered(true);
              })
              .catch(error => {
                console.error("Mermaid rendering error:", error);
                // Try with a simpler fallback mindmap if the first one fails
                const fallbackMindmap = `mindmap
  root((Document Overview))
    Key Concepts
    Main Findings
    Methods Used`;
                
                mermaid.render(newId, fallbackMindmap)
                  .then(({ svg }) => {
                    element.innerHTML = svg;
                    setIsRendered(true);
                    toast({
                      title: "Using simplified mindmap",
                      description: "The full mindmap couldn't be rendered due to syntax issues",
                      variant: "default"
                    });
                  })
                  .catch(fallbackError => {
                    console.error("Fallback mindmap rendering error:", fallbackError);
                    toast({
                      title: "Rendering Error",
                      description: "Failed to render the mindmap",
                      variant: "destructive"
                    });
                  });
              });
          }
        }, 300); // Increased delay for DOM rendering
      } catch (error) {
        console.error("Mermaid processing error:", error);
      }
    }
  }, [mindmapCode, open, toast]);

  // Generate the mindmap using Gemini API
  const generateMindmap = async () => {
    setIsLoading(true);
    try {
      let mindmapText = await generateMindmapFromPdf();
      
      // Fix common syntax issues
      mindmapText = fixMindmapSyntax(mindmapText);
      
      setMindmapCode(mindmapText);
    } catch (error) {
      console.error("Error generating mindmap:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate mindmap from the PDF",
        variant: "destructive"
      });
      setMindmapCode(`mindmap
  root((Error))
    Failed to generate mindmap
      Please try again`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix common mindmap syntax issues
  const fixMindmapSyntax = (code: string): string => {
    // Ensure the code starts with mindmap
    if (!code.trim().startsWith("mindmap")) {
      code = "mindmap\n" + code;
    }

    // Replace problematic indentation 
    const lines = code.split('\n');
    const fixedLines = lines.map(line => {
      // Fix any spaces after indentation that might cause parsing errors
      return line.replace(/^(\s+)(\S+.*)/, (match, indent, content) => {
        // Ensure consistent indentation (2 spaces per level)
        const level = Math.ceil(indent.length / 2);
        return "  ".repeat(level) + content;
      });
    });

    // Ensure root node has proper syntax
    let hasRoot = false;
    for (let i = 0; i < fixedLines.length; i++) {
      if (fixedLines[i].includes("root((") && fixedLines[i].includes("))")) {
        hasRoot = true;
        break;
      }
    }

    if (!hasRoot) {
      // Insert proper root node after mindmap declaration
      for (let i = 0; i < fixedLines.length; i++) {
        if (fixedLines[i].trim() === "mindmap") {
          fixedLines[i+1] = "  root((Document))" + (fixedLines[i+1] ? "\n" + fixedLines[i+1] : "");
          break;
        }
      }
    }

    return fixedLines.join('\n');
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

  // Function to retry mindmap generation
  const handleRetry = () => {
    generateMindmap();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex justify-between items-center flex-row">
          <DialogTitle>Document Mindmap</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline" size="sm" className="flex gap-2 items-center">
              Regenerate
            </Button>
            <Button onClick={exportAsSVG} variant="outline" size="sm" className="flex gap-2 items-center">
              <Download className="h-4 w-4" /> Export SVG
            </Button>
          </div>
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
