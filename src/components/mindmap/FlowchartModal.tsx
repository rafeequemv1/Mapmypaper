
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis'
  },
  securityLevel: 'loose',
  fontSize: 16
});

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [flowchartCode, setFlowchartCode] = useState<string>("");
  const flowchartRef = useRef<HTMLDivElement>(null);

  // Generate flowchart when the modal is opened
  useEffect(() => {
    if (open && !flowchartCode) {
      generateFlowchart();
    }
  }, [open]);

  // Render flowchart whenever the code changes
  useEffect(() => {
    if (flowchartCode && open && flowchartRef.current) {
      renderFlowchart();
    }
  }, [flowchartCode, open]);

  // Generate flowchart from PDF content
  const generateFlowchart = async () => {
    setIsLoading(true);
    try {
      const mermaidCode = await generateFlowchartFromPdf();
      setFlowchartCode(mermaidCode);
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Error",
        description: "Failed to generate flowchart. Please try again.",
        variant: "destructive",
      });
      setFlowchartCode(`flowchart TD
        A[Error] --> B[Generation Failed]
        B --> C[Please try again]`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the flowchart using mermaid
  const renderFlowchart = async () => {
    if (!flowchartRef.current) return;

    try {
      // Clear the container first
      flowchartRef.current.innerHTML = '';
      
      // Create a unique ID for this render
      const id = `flowchart-${Date.now()}`;
      
      // Create a container with the unique ID
      const container = document.createElement('div');
      container.id = id;
      container.className = 'mermaid';
      container.textContent = flowchartCode;
      
      // Add to the DOM
      flowchartRef.current.appendChild(container);
      
      // Render with mermaid
      await mermaid.run({
        nodes: [container]
      });
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      
      // Simple fallback - show the code instead
      if (flowchartRef.current) {
        flowchartRef.current.innerHTML = `
          <div class="p-4 border border-red-300 bg-red-50 rounded-md">
            <p class="text-red-500 mb-2">Error rendering flowchart.</p>
            <pre class="text-xs overflow-auto p-2 bg-gray-100 rounded">${flowchartCode}</pre>
          </div>
        `;
      }
    }
  };

  // Download the flowchart as PNG
  const downloadFlowchart = async () => {
    if (!flowchartRef.current) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating image from flowchart...",
      });
      
      // Capture the flowchart as canvas
      const canvas = await html2canvas(flowchartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, "paper_flowchart.png");
          toast({
            title: "Download Complete",
            description: "Flowchart has been downloaded as PNG.",
          });
        }
      });
    } catch (error) {
      console.error("Error downloading flowchart:", error);
      toast({
        title: "Download Failed",
        description: "Could not create download. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[75vw] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-xl">
            <span>Paper Flowchart</span>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={downloadFlowchart}
                className="flex gap-1 text-sm"
                variant="outline"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={generateFlowchart}
                disabled={isLoading}
                className="flex gap-1 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] p-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <p className="text-center text-muted-foreground text-lg">
              Generating flowchart from paper content...
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              This may take a moment as we analyze the document structure.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto py-4">
            <div 
              ref={flowchartRef} 
              className="flex justify-center items-center min-h-[50vh] p-4 bg-white"
            >
              {!flowchartCode && (
                <div className="text-center text-muted-foreground">
                  No flowchart generated yet.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
