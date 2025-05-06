
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf, generateMindmapFromPdf } from "@/services/geminiService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { downloadBlob } from "@/utils/downloadUtils";

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

type DiagramType = 'flowchart' | 'mindmap';

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [diagramCode, setDiagramCode] = useState<string>("");
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const diagramRef = useRef<HTMLDivElement>(null);

  // Generate diagram when the modal is opened or type changes
  useEffect(() => {
    if (open && (!diagramCode || diagramType === 'flowchart')) {
      generateDiagram();
    }
  }, [open, diagramType]);

  // Render diagram whenever the code changes
  useEffect(() => {
    if (diagramCode && open && diagramRef.current) {
      renderDiagram();
    }
  }, [diagramCode, open]);

  // Generate diagram based on selected type
  const generateDiagram = async () => {
    setIsLoading(true);
    try {
      let mermaidCode;
      if (diagramType === 'flowchart') {
        mermaidCode = await generateFlowchartFromPdf();
      } else {
        mermaidCode = await generateMindmapFromPdf();
      }
      setDiagramCode(mermaidCode);
    } catch (error) {
      console.error(`Error generating ${diagramType}:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${diagramType}. Please try again.`,
        variant: "destructive",
      });
      // Set fallback diagram
      setDiagramCode(diagramType === 'flowchart'
        ? `flowchart TD\n  A[Error] --> B[Generation Failed]\n  B --> C[Please try again]`
        : `mindmap\n  root((Error))\n    Failed to generate mindmap\n      Please try again`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render the diagram using mermaid
  const renderDiagram = async () => {
    if (!diagramRef.current) return;

    try {
      // Clear the container first
      diagramRef.current.innerHTML = '';
      
      // Create a unique ID for this render
      const id = `diagram-${Date.now()}`;
      
      // Create a container with the unique ID
      const container = document.createElement('div');
      container.id = id;
      container.className = 'mermaid';
      container.textContent = diagramCode;
      
      // Add to the DOM
      diagramRef.current.appendChild(container);
      
      // Render with mermaid
      await mermaid.run({
        nodes: [container]
      });
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      
      // Simple fallback - show the code instead
      if (diagramRef.current) {
        diagramRef.current.innerHTML = `
          <div class="p-4 border border-red-300 bg-red-50 rounded-md">
            <p class="text-red-500 mb-2">Error rendering diagram.</p>
            <pre class="text-xs overflow-auto p-2 bg-gray-100 rounded">${diagramCode}</pre>
          </div>
        `;
      }
    }
  };

  // Handle diagram type change
  const handleDiagramTypeChange = (value: DiagramType) => {
    if (value !== diagramType) {
      setDiagramType(value);
      setDiagramCode(""); // Clear current diagram
    }
  };

  // Download the diagram as PNG
  const downloadDiagram = async () => {
    if (!diagramRef.current) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating image from diagram...",
      });
      
      // Capture the diagram as canvas
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = diagramType === 'flowchart' ? "paper_flowchart.png" : "paper_mindmap.png";
          downloadBlob(blob, fileName);
          toast({
            title: "Download Complete",
            description: `${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} has been downloaded as PNG.`,
          });
        }
      });
    } catch (error) {
      console.error("Error downloading diagram:", error);
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
            <span>Paper Visualization</span>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={downloadDiagram}
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
                onClick={generateDiagram}
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

        <div className="flex items-center justify-center mb-4 mt-2">
          <RadioGroup 
            className="flex gap-4" 
            value={diagramType} 
            onValueChange={(value) => handleDiagramTypeChange(value as DiagramType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flowchart" id="flowchart" />
              <label htmlFor="flowchart" className="text-sm font-medium leading-none cursor-pointer">
                Flowchart
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mindmap" id="mindmap" />
              <label htmlFor="mindmap" className="text-sm font-medium leading-none cursor-pointer">
                Mind Map
              </label>
            </div>
          </RadioGroup>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] p-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <p className="text-center text-muted-foreground text-lg">
              Generating {diagramType} from paper content...
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              This may take a moment as we analyze the document structure.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto py-4">
            <div 
              ref={diagramRef} 
              className="flex justify-center items-center min-h-[50vh] p-4 bg-white"
            >
              {!diagramCode && (
                <div className="text-center text-muted-foreground">
                  No diagram generated yet.
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
