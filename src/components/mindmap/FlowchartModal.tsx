
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const flowchartRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  
  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, sans-serif',
    });
  }, []);

  // Generate flowchart when the modal is opened
  useEffect(() => {
    if (open) {
      generateFlowchart();
    }
  }, [open]);

  // Regenerate flowchart
  const generateFlowchart = async () => {
    setIsLoading(true);
    
    try {
      // Basic paper structure diagram based on common academic paper structure
      const flowchartDefinition = `
        flowchart TB
          classDef intro fill:#d1c1f6,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95
          classDef methodology fill:#c4b5fd,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95
          classDef results fill:#ddd6fe,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95
          classDef discussion fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95
          classDef appendix fill:#f5f3ff,stroke:#8b5cf6,stroke-width:1px,color:#4c1d95
          
          title["Paper Structure"]:::intro
          
          title --> abstract["Abstract"]:::intro
          title --> intro["1. Introduction"]:::intro
          title --> background["2. Background & Related Work"]:::intro
          title --> methods["3. Methodology"]:::methodology
          title --> results["4. Results"]:::results
          title --> discussion["5. Discussion"]:::discussion
          title --> conclusion["6. Conclusion"]:::discussion
          title --> references["References"]:::appendix
          
          intro --> problem["1.1 Problem Statement"]:::intro
          intro --> contributions["1.2 Contributions"]:::intro
          intro --> outline["1.3 Paper Outline"]:::intro
          
          methods --> design["3.1 Experimental Design"]:::methodology
          methods --> data["3.2 Dataset"]:::methodology
          methods --> models["3.3 Models/Algorithms"]:::methodology
          methods --> implementation["3.4 Implementation Details"]:::methodology
          
          results --> metrics["4.1 Evaluation Metrics"]:::results
          results --> comparisons["4.2 Comparative Analysis"]:::results
          results --> findings["4.3 Key Findings"]:::results
          
          discussion --> implications["5.1 Implications"]:::discussion
          discussion --> limitations["5.2 Limitations"]:::discussion
          discussion --> future["5.3 Future Work"]:::discussion
      `;

      // Clear previous flowchart
      if (flowchartRef.current) {
        flowchartRef.current.innerHTML = '';
        flowchartRef.current.setAttribute('class', 'mermaid');
        flowchartRef.current.textContent = flowchartDefinition;
        
        // Render mermaid diagram
        await mermaid.run();
      }
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Flowchart Generation Failed",
        description: "Could not generate a flowchart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download flowchart as PNG
  const downloadFlowchartAsPNG = async () => {
    if (!flowchartRef.current) return;
    
    try {
      toast({
        title: "Preparing Image",
        description: "Please wait while we generate your PNG...",
      });
      
      const element = flowchartRef.current;
      const canvas = await html2canvas(element, {
        scale: 2 * zoom, // Higher quality with zoom factor
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'paper_structure_flowchart.png';
      link.click();
      
      toast({
        title: "Download Complete",
        description: "Flowchart has been downloaded as PNG",
      });
    } catch (error) {
      console.error("Error downloading flowchart:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the flowchart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Zoom in functionality
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  // Zoom out functionality
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Paper Structure Flowchart</span>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={zoomOut}
                variant="outline"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button 
                size="sm"
                onClick={zoomIn}
                variant="outline"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button 
                size="sm"
                onClick={generateFlowchart}
                variant="outline"
                disabled={isLoading}
                title="Regenerate Flowchart"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button 
                size="sm"
                onClick={downloadFlowchartAsPNG}
                variant="outline"
                title="Download as PNG"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground">
              Generating paper structure flowchart...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
            <div 
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-in-out',
                marginBottom: zoom > 1 ? '100px' : '0' // Add space when zoomed in
              }}
            >
              <div ref={flowchartRef} className="mermaid"></div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
