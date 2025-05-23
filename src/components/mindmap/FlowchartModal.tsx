
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
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  flowchart: {
    useMaxWidth: true,
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
  
  // Add state for active PDF key
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  // Generate diagram when the modal is opened or type changes or PDF changes
  useEffect(() => {
    if (open && ((!diagramCode || diagramType === 'flowchart') || activePdfKey)) {
      generateDiagram();
    }
  }, [open, diagramType, activePdfKey]);

  // Render diagram whenever the code changes
  useEffect(() => {
    if (diagramCode && open && diagramRef.current) {
      renderDiagram();
    }
  }, [diagramCode, open]);

  // Process mindmap text to ensure proper syntax
  const processMindMapText = (text: string): string => {
    // Remove any non-compliant characters or formatting
    let processed = text.replace(/\(/g, ' ');
    processed = processed.replace(/\)/g, ' ');
    
    // Ensure lines are properly formatted with indentation instead of spaces
    const lines = processed.split('\n');
    let result = 'mindmap\n';
    
    // Add the root node
    if (lines.length > 0) {
      const title = lines[0].trim().replace(/["']/g, '');
      result += `  root((${title}))\n`;
      
      // Process the remaining lines as child nodes with proper indentation
      let currentLevel = 1;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Skip lines that might cause parsing errors
        if (line.includes('(') || line.includes(')') || line.includes('{') || line.includes('}') || line.includes('[') || line.includes(']')) {
          continue;
        }
        
        // Add proper indentation
        const indent = '    '.repeat(currentLevel);
        result += `${indent}${line}\n`;
      }
    }
    
    return result;
  };

  // Generate diagram based on selected type
  const generateDiagram = async () => {
    setIsLoading(true);
    try {
      let mermaidCode;
      if (diagramType === 'flowchart') {
        mermaidCode = await generateFlowchartFromPdf();
        // Ensure flowchart is LR (left to right)
        if (mermaidCode.includes('flowchart TD') || mermaidCode.includes('flowchart TB')) {
          mermaidCode = mermaidCode.replace(/flowchart (TD|TB)/, 'flowchart LR');
        }
      } else {
        let rawMindmapCode = await generateMindmapFromPdf();
        // Process the mind map syntax to ensure proper formatting
        mermaidCode = processMindMapText(rawMindmapCode);
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
        ? `flowchart LR\n  A[Error] --> B[Generation Failed]\n  B --> C[Please try again]`
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
      
      // For mindmaps, add full-screen style
      if (diagramType === 'mindmap') {
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '60vh';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
      } else {
        // For flowcharts, ensure it stays within the canvas
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflow = 'auto';
      }
      
      console.log("Rendering diagram with code:", diagramCode);
      container.textContent = diagramCode;
      
      // Add to the DOM
      diagramRef.current.appendChild(container);
      
      try {
        // Render with mermaid
        await mermaid.run({
          nodes: [container]
        });
        
        // For mindmap, find the SVG and make it full size
        if (diagramType === 'mindmap') {
          const svg = container.querySelector('svg');
          if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.maxHeight = '60vh';
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
          }
        } else if (diagramType === 'flowchart') {
          // For flowcharts, ensure SVG fits within container
          const svg = container.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
            svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
          }
        }
      } catch (renderError) {
        console.error("Mermaid rendering error:", renderError);
        throw renderError;
      }
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      
      // Simple fallback - show the error and code instead
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

  // Handle PDF tab change
  const handlePdfChange = (key: string) => {
    setActivePdfKey(key);
    
    // Dispatch an event to inform other components about tab change
    window.dispatchEvent(
      new CustomEvent('pdfTabChanged', { 
        detail: { activeKey: key } 
      })
    );
    
    // Clear current diagram so it regenerates for the selected PDF
    setDiagramCode("");
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
        className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
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

        {/* PDF tabs */}
        <div className="mb-1">
          <PdfTabs
            activeKey={activePdfKey}
            onTabChange={handlePdfChange}
            onRemove={() => {}} // We don't want to allow removal from this modal
          />
        </div>

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
          <div className="flex-1 overflow-auto py-4 relative">
            <div 
              ref={diagramRef} 
              className={`flex justify-center items-center ${diagramType === 'mindmap' ? 'w-full h-full min-h-[65vh]' : 'w-full min-h-[65vh] overflow-auto'} p-4 bg-white`}
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
