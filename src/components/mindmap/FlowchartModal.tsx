import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf, generateMindmapFromPdf } from "@/services/geminiService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { downloadBlob } from "@/utils/downloadUtils";
import { Card } from "@/components/ui/card";

// Initialize mermaid with optimized settings
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 60,
    rankSpacing: 60,
    // Remove the invalid rankDir property
  },
  securityLevel: 'loose',
  fontSize: 14
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
  const [scale, setScale] = useState(1);
  
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
  }, [diagramCode, open, scale]);

  // Generate more detailed multi-branched flowcharts or mindmaps
  const generateDiagram = async () => {
    setIsLoading(true);
    try {
      let mermaidCode;
      
      if (diagramType === 'flowchart') {
        mermaidCode = await generateFlowchartFromPdf();
        
        // Make flowchart more detailed if it's too simple
        if (mermaidCode.split('\n').length < 10) {
          // Create a more complex, multibranched flowchart as fallback
          mermaidCode = `
flowchart LR
    A[Research Question] --> B{Study Design}
    B -->|Experimental| C[Laboratory Setup]
    B -->|Observational| D[Data Collection]
    B -->|Review| E[Literature Search]
    
    C --> F[Sample Preparation]
    F --> G[Experimental Protocol]
    G --> H{Analysis Method}
    
    D --> I[Survey Design]
    D --> J[Field Observation]
    I --> H
    J --> H
    
    E --> K[Inclusion Criteria]
    K --> L[Quality Assessment]
    L --> H
    
    H -->|Statistical| M[Statistical Tests]
    H -->|Qualitative| N[Thematic Analysis]
    H -->|Mixed Methods| O[Triangulation]
    
    M --> P[Results]
    N --> P
    O --> P
    
    P --> Q{Significance}
    Q -->|Significant| R[Interpretation]
    Q -->|Non-significant| S[Alternative Analysis]
    
    R --> T[Conclusion]
    S --> U[Limitations]
    U --> T
    
    T --> V[Future Research]`;
        } else {
          // Instead of modifying the flowchart type, set direction in the diagram code itself
          if (!mermaidCode.includes('flowchart LR')) {
            mermaidCode = mermaidCode.replace(/flowchart (TD|TB)/, 'flowchart LR');
          }
        }
      } else {
        mermaidCode = await generateMindmapFromPdf();
        
        // Make mindmap more detailed if it's too simple
        if (mermaidCode.split('\n').length < 10) {
          // Create a more complex mindmap as fallback
          mermaidCode = `
mindmap
  root((Research Paper))
    Methods
      Data Collection
        Surveys
        Interviews
        Observations
      Analysis
        Quantitative
          Statistical Tests
          Regression Models
        Qualitative
          Thematic Analysis
          Content Analysis
    Results
      Primary Findings
        Key Result 1
        Key Result 2
        Key Result 3
      Secondary Outcomes
        Unexpected Finding 1
        Unexpected Finding 2
    Discussion
      Interpretation
        Comparison to Literature
        Theoretical Implications
      Limitations
        Sample Size
        Methodology Constraints
      Future Directions
        Short-term Research
        Long-term Applications`;
        }
      }
      setDiagramCode(mermaidCode);
      
      // Reset scale when generating a new diagram
      setScale(1);
    } catch (error) {
      console.error(`Error generating ${diagramType}:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${diagramType}. Please try again.`,
        variant: "destructive",
      });
      // Set fallback diagram
      if (diagramType === 'flowchart') {
        setDiagramCode(`
flowchart LR
    A[Research Question] --> B{Study Design}
    B -->|Experimental| C[Laboratory Work]
    B -->|Observational| D[Data Collection]
    B -->|Review| E[Literature Review]
    
    C --> F[Results Analysis]
    D --> F
    E --> F
    
    F --> G[Interpretation]
    G --> H[Conclusion]`);
      } else {
        setDiagramCode(`
mindmap
  root((Research Paper))
    Methods
      Data Collection
      Analysis
    Results
      Primary Findings
      Secondary Outcomes
    Discussion
      Interpretation
      Limitations`);
      }
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
      container.className = 'mermaid diagram-container';
      
      // Apply transformation based on current scale
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top center';
      container.style.width = '100%';
      container.textContent = diagramCode;
      
      // Add to the DOM
      diagramRef.current.appendChild(container);
      
      // Render with mermaid
      await mermaid.run({
        nodes: [container]
      });
      
      // Adjust SVG to fit in container
      const svg = container.querySelector('svg');
      if (svg) {
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        
        // For mindmap specifically
        if (diagramType === 'mindmap') {
          svg.style.maxHeight = '60vh';
        }
      }
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
      
      // Capture the diagram as canvas - use scale=2 for higher resolution
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

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2)); // Limit max zoom to 2x
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5)); // Limit min zoom to 0.5x
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[90vw] w-[850px] max-h-[90vh] overflow-hidden flex flex-col"
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
          <DialogDescription className="text-sm text-gray-500">
            {diagramType === 'flowchart' ? 
              'Visual representation of the paper\'s methodology as a flowchart.' : 
              'Visual representation of the paper\'s key concepts as a mind map.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2 mt-2">
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
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={zoomIn}
              disabled={scale >= 2}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
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
          <Card className="flex-1 overflow-hidden p-2 border bg-white">
            <div className="overflow-auto h-[60vh] p-4 flex justify-center">
              <div 
                ref={diagramRef} 
                className="transition-transform duration-200 w-full"
              >
                {!diagramCode && (
                  <div className="text-center text-muted-foreground">
                    No diagram generated yet.
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
