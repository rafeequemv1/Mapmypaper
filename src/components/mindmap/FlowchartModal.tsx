
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, Share2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultFlowchart = `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    });
  }, []);

  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open && code === defaultFlowchart) {
      generateFlowchart();
    } else if (open && previewRef.current) {
      renderFlowchart();
    }
  }, [open]);

  // Render flowchart when code changes
  useEffect(() => {
    if (open && previewRef.current) {
      renderFlowchart();
    }
  }, [code]);

  const generateFlowchart = async () => {
    try {
      setIsGenerating(true);
      const flowchartCode = await generateFlowchartFromPdf();
      setCode(flowchartCode);
      toast({
        title: "Flowchart Generated",
        description: "A flowchart has been created based on your PDF content.",
      });
    } catch (err) {
      console.error("Failed to generate flowchart:", err);
      toast({
        title: "Generation Failed",
        description: "Failed to generate flowchart from PDF content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFlowchart = async () => {
    if (!previewRef.current) return;

    try {
      // Clear the preview area
      previewRef.current.innerHTML = "";
      setError(null);

      // Create a unique ID for the diagram
      const id = `flowchart-${Date.now()}`;
      
      // Parse and render the flowchart
      const { svg } = await mermaid.render(id, code);
      previewRef.current.innerHTML = svg;
    } catch (err) {
      console.error("Failed to render flowchart:", err);
      setError(err instanceof Error ? err.message : "Failed to render flowchart");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const exportSvg = () => {
    if (!previewRef.current || !previewRef.current.querySelector("svg")) {
      toast({
        title: "Export Failed",
        description: "No flowchart to export. Please ensure your flowchart renders correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgElement = previewRef.current.querySelector("svg");
      const svgData = new XMLSerializer().serializeToString(svgElement!);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "flowchart.svg";
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your flowchart has been exported as SVG.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the flowchart: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const exportPng = async () => {
    if (!previewRef.current || !previewRef.current.querySelector("svg")) {
      toast({
        title: "Export Failed",
        description: "No flowchart to export. Please ensure your flowchart renders correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgElement = previewRef.current.querySelector("svg")!;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Get SVG dimensions
      const bbox = svgElement.getBBox();
      canvas.width = bbox.width * 2; // Scale up for better quality
      canvas.height = bbox.height * 2;
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        // Convert canvas to PNG
        canvas.toBlob((blob) => {
          if (!blob) return;
          
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "flowchart.png";
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          
          toast({
            title: "Export Successful",
            description: "Your flowchart has been exported as PNG.",
          });
        }, "image/png");
      };
      
      img.src = url;
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `There was an error exporting the flowchart: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
          <DialogDescription>
            Create and edit flowcharts using Mermaid syntax. The initial flowchart is generated based on your PDF content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Code editor */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Mermaid Code</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateFlowchart} 
                disabled={isGenerating}
                className="flex items-center gap-1"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                {isGenerating ? "Generating..." : "Regenerate"}
              </Button>
            </div>
            <Textarea
              value={code}
              onChange={handleCodeChange}
              className="flex-1 font-mono text-sm resize-none"
              placeholder="Enter your Mermaid flowchart code here..."
            />
            {error && (
              <div className="mt-2 text-red-500 text-sm overflow-auto max-h-24">
                {error}
              </div>
            )}
          </div>
          
          {/* Preview */}
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
            <div className="border rounded-md p-4 flex-1 overflow-auto bg-white">
              <div ref={previewRef} className="flex justify-center items-center h-full">
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  /* Flowchart will be rendered here */
                  null
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button onClick={exportSvg} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export SVG
            </Button>
            <Button onClick={exportPng} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export PNG
            </Button>
          </div>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
