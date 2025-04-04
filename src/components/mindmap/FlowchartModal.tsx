import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { generateFlowchartFromPdf } from "@/services/geminiService";
import { Loader, Download, FileIcon, Image } from "lucide-react";
import { isPdfAvailable } from "@/utils/pdfStorage";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [flowchartSyntax, setFlowchartSyntax] = useState<string>(
`flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process One]
  B -->|No| D[Process Two]
  C --> E[End]
  D --> E`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  
  // Check if PDF is available when component mounts or modal opens
  useEffect(() => {
    if (open) {
      checkPdfAvailability();
      
      try {
        mermaid.initialize({
          startOnLoad: true,
          theme: "default",
          securityLevel: "loose",
        });
        
        setTimeout(() => {
          mermaid.contentLoaded();
        }, 100);
      } catch (error) {
        console.error("Error initializing mermaid:", error);
      }
    }
  }, [open, flowchartSyntax]);

  // Auto-generate flowchart when modal opens and PDF is available
  useEffect(() => {
    if (open && isPdfLoaded && !isGenerating) {
      handleGenerateFromPaper();
    }
  }, [open, isPdfLoaded]);

  // Check if PDF content is available
  const checkPdfAvailability = async () => {
    const hasPdf = await isPdfAvailable();
    setIsPdfLoaded(hasPdf);
    
    if (!hasPdf) {
      console.log("No PDF content is available for generating a flowchart");
    } else {
      console.log("PDF content is available for flowchart generation");
    }
  };

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFlowchartSyntax(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    if (!isPdfLoaded) {
      toast({
        title: "No paper content available",
        description: "Please upload a PDF paper first before generating a flowchart.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      // Use Gemini to generate a flowchart syntax from the PDF content
      const generatedFlowchart = await generateFlowchartFromPdf();
      
      if (generatedFlowchart && generatedFlowchart.trim() !== '') {
        setFlowchartSyntax(generatedFlowchart);
        toast({
          title: "Flowchart generated",
          description: "Successfully created flowchart from your paper content."
        });
      } else {
        toast({
          title: "Generation issue",
          description: "Couldn't generate a proper flowchart. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating flowchart from paper:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flowchart",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      // Ensure mermaid re-renders the diagram
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    }
  };

  // Export diagram as PNG
  const handleExportPNG = async () => {
    if (!open) return;
    
    try {
      const mermaidContainer = document.querySelector('.mermaid-container .mermaid');
      if (!mermaidContainer) {
        toast({
          title: "Export failed",
          description: "Diagram not found",
          variant: "destructive"
        });
        return;
      }
      
      const svgElement = mermaidContainer.querySelector('svg');
      
      if (svgElement) {
        // Create a container div to hold the SVG for capture
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(svgElement.cloneNode(true));
        document.body.appendChild(tempContainer);
        
        try {
          // Use html2canvas on the div containing the SVG
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'flowchart.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Export successful",
            description: "Flowchart exported as PNG"
          });
        } finally {
          // Clean up
          document.body.removeChild(tempContainer);
        }
      } else {
        toast({
          title: "Export failed",
          description: "SVG element not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error exporting as PNG:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Export diagram as PDF
  const handleExportPDF = async () => {
    if (!open) return;
    
    try {
      const mermaidContainer = document.querySelector('.mermaid-container .mermaid');
      if (!mermaidContainer) {
        toast({
          title: "Export failed",
          description: "Diagram not found",
          variant: "destructive"
        });
        return;
      }
      
      const svgElement = mermaidContainer.querySelector('svg');
      
      if (svgElement) {
        // Create a container div to hold the SVG for capture
        const tempContainer = document.createElement('div');
        tempContainer.appendChild(svgElement.cloneNode(true));
        document.body.appendChild(tempContainer);
        
        try {
          // Use html2canvas on the div containing the SVG
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });
          
          // Get dimensions
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // Calculate proper scaling
          const margin = 10;
          const availableWidth = pdfWidth - (margin * 2);
          const availableHeight = pdfHeight - (margin * 2);
          
          const aspectRatio = imgProps.width / imgProps.height;
          let width = availableWidth;
          let height = width / aspectRatio;
          
          if (height > availableHeight) {
            height = availableHeight;
            width = height * aspectRatio;
          }
          
          // Add image to PDF
          const x = (pdfWidth - width) / 2;
          const y = (pdfHeight - height) / 2;
          
          pdf.addImage(dataUrl, 'PNG', x, y, width, height);
          
          // Add metadata
          pdf.setFontSize(10);
          pdf.text(`MapMyPaper - Flowchart`, pdfWidth / 2, 10, { align: 'center' });
          pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
          
          // Save PDF
          pdf.save('flowchart.pdf');
          
          toast({
            title: "Export successful",
            description: "Flowchart exported as PDF"
          });
        } finally {
          // Clean up
          document.body.removeChild(tempContainer);
        }
      } else {
        toast({
          title: "Export failed",
          description: "SVG element not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error exporting as PDF:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Edit Flowchart Syntax</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGenerateFromPaper}
                disabled={isGenerating || !isPdfLoaded}
                className="text-xs"
                title={!isPdfLoaded ? "Upload a PDF first to enable this feature" : ""}
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : "Regenerate"}
              </Button>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              value={flowchartSyntax}
              onChange={handleSyntaxChange}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-semibold">Syntax Tips:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Start with <code>flowchart TD</code> for top-down flow</li>
                <li>Node shapes: <code>A[Rectangle]</code>, <code>B(Rounded)</code>, <code>C{"{"}Hexagon{"}"}</code>, <code>D{">"}"Diamond"{"<"}</code></li>
                <li>Arrows: <code>--&gt;</code> for lines, <code>--&gt;|text|</code> for labels</li>
                <li>Styling: <code>style A fill:#f9f,stroke:#333</code></li>
                <li>Subgraphs: <code>subgraph title ... end</code></li>
              </ul>
            </div>
          </div>
          
          {/* Flowchart preview */}
          <div className="w-full md:w-3/5 border rounded-md p-4 overflow-auto bg-white">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="mermaid-container overflow-auto">
              <div className="mermaid">{flowchartSyntax}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
