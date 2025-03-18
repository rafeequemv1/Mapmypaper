
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
import { Download, RefreshCcw } from "lucide-react";
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

  // Initialize mermaid with safe configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      },
      logLevel: 3 // Enables warning logs for debugging
    });
  }, []);

  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open) {
      if (code === defaultFlowchart) {
        generateFlowchart();
      } else {
        renderFlowchart();
      }
    }
  }, [open]);

  // Render flowchart when code changes
  useEffect(() => {
    if (open && previewRef.current) {
      renderFlowchart();
    }
  }, [code]);

  // Helper function to clean and validate Mermaid syntax
  const cleanMermaidSyntax = (input: string): string => {
    let cleaned = input.trim();
    
    // Fix common syntax errors
    cleaned = cleaned
      // Fix arrows if needed
      .replace(/->/g, "-->")
      // Replace any hyphens in node IDs with underscores
      .replace(/(\w+)-(\w+)(\[|\(|\{|\[\(|\{\{|\>\[)/g, "$1_$2$3")
      // Replace year ranges with underscores
      .replace(/(\d{4})-(\d{4})/g, "$1_$2")
      // Fix malformed node definitions (missing closing brackets)
      .replace(/(\w+\[.*?)(\r?\n|\s{2,})/g, "$1]$2")
      .replace(/(\w+\(.*?)(\r?\n|\s{2,})/g, "$1)$2")
      .replace(/(\w+\{.*?)(\r?\n|\s{2,})/g, "$1}$2");
    
    // Ensure it starts with flowchart directive
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart TD\n" + cleaned;
    }
    
    return cleaned;
  };

  const generateFlowchart = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const flowchartCode = await generateFlowchartFromPdf();
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      // Check if the flowchart code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Flowchart Generated",
          description: "A flowchart has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(defaultFlowchart);
        toast({
          title: "Syntax Error",
          description: "The generated flowchart had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to generate flowchart:", err);
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
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
      
      // Attempt to clean the syntax before parsing
      const cleanedCode = cleanMermaidSyntax(code);
      
      // Parse the flowchart to verify syntax before rendering
      await mermaid.parse(cleanedCode);
      
      // If parse succeeds, render the flowchart
      const { svg } = await mermaid.render(id, cleanedCode);
      previewRef.current.innerHTML = svg;
    } catch (err) {
      console.error("Failed to render flowchart:", err);
      setError(err instanceof Error ? err.message : "Failed to render flowchart");
      
      // Display error message in preview area
      if (previewRef.current) {
        previewRef.current.innerHTML = `<div class="text-red-500 p-4">
          <h3 class="font-bold">Rendering Error</h3>
          <p>${err instanceof Error ? err.message : "Unknown error"}</p>
          <p class="mt-2 text-sm">Common errors:</p>
          <ul class="list-disc pl-5 text-sm">
            <li>Node IDs should be alphanumeric without hyphens</li>
            <li>All node text must be in brackets: [text], (text), or {text}</li>
            <li>Arrows should use --{'>'}  not -{'>'}  </li>
          </ul>
        </div>`;
      }
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
              <div className="mt-2 text-red-500 text-sm overflow-auto max-h-24 bg-red-50 p-2 rounded border border-red-100">
                {error}
              </div>
            )}
            <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600">
              <h4 className="font-medium">Quick Syntax Reference:</h4>
              <ul className="mt-1 pl-4 list-disc">
                <li>Start with <code className="bg-gray-100 px-1">flowchart TD</code> for top-down layout</li>
                <li>Node syntax: <code className="bg-gray-100 px-1">nodeId[Text]</code> or <code className="bg-gray-100 px-1">nodeId(Text)</code> or <code className="bg-gray-100 px-1">nodeId{'{'+'Text'+'}'}</code></li>
                <li>Connection: <code className="bg-gray-100 px-1">A --{'>'} B</code></li>
                <li>Labeled edge: <code className="bg-gray-100 px-1">A --{'>'}{"|Label|"} B</code></li>
                <li>Use alphanumeric IDs without hyphens or spaces</li>
                <li>Subgraph: <code className="bg-gray-100 px-1">subgraph title ... end</code></li>
              </ul>
            </div>
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
