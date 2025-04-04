
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { Loader, Download, FilePdf, Image } from "lucide-react";
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

interface MermaidMindMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindMapModal: React.FC<MermaidMindMapModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [mermaidSyntax, setMermaidSyntax] = useState<string>(
`mindmap
  root((MapMyPaper))
    Research Paper
      Introduction
        Background
        Objectives
      Methods
        Data Collection
        Analysis
      Results
        Key Findings
        Charts & Tables
      Discussion
        Implications
        Limitations
      Conclusion
        Summary
        Future Research`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize mermaid when component mounts
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, []);
  
  // Function to render the mindmap
  const renderMindmap = () => {
    if (!mermaidContainerRef.current || !open) return;
    
    try {
      console.log("Rendering mindmap with syntax:", mermaidSyntax);
      
      // The key fix: completely recreate the mermaid container element
      const container = mermaidContainerRef.current;
      container.innerHTML = ''; // Clear existing content
      
      // Create a new pre element with class mermaid
      const pre = document.createElement('pre');
      pre.className = 'mermaid';
      pre.textContent = mermaidSyntax;
      
      // Add it to the container
      container.appendChild(pre);
      
      // Force mermaid to process the content
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 10);
    } catch (error) {
      console.error("Error rendering mermaid diagram:", error);
    }
  };
  
  // Re-render mermaid diagram whenever syntax changes
  useEffect(() => {
    if (open) {
      renderMindmap();
    }
  }, [mermaidSyntax, open]);
  
  // Check if PDF content is available when modal opens
  useEffect(() => {
    if (open) {
      checkPdfAvailability();
    }
  }, [open]);

  // Check if PDF content is available
  const checkPdfAvailability = async () => {
    const hasPdf = await isPdfAvailable();
    setIsPdfLoaded(hasPdf);
    
    if (!hasPdf) {
      console.log("No PDF content is available for generating a mindmap");
    } else {
      console.log("PDF content is available for mindmap generation");
    }
  };

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidSyntax(e.target.value);
  };

  const handleGenerateFromPaper = async () => {
    if (!isPdfLoaded) {
      toast({
        title: "No paper content available",
        description: "Please upload a PDF paper first before generating a mindmap.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      // Use Gemini to generate a mindmap syntax from the PDF content
      const generatedMindmap = await generateMindmapFromPdf();
      
      if (generatedMindmap && generatedMindmap.trim() !== '') {
        setMermaidSyntax(generatedMindmap);
        toast({
          title: "Mindmap generated",
          description: "Successfully created mindmap from your paper content."
        });
      } else {
        toast({
          title: "Generation issue",
          description: "Couldn't generate a proper mindmap. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating mindmap from paper:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate mindmap",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Export diagram as PNG
  const handleExportPNG = async () => {
    if (!mermaidContainerRef.current) return;
    
    try {
      const container = mermaidContainerRef.current;
      const svgElement = container.querySelector('svg');
      
      if (svgElement) {
        const canvas = await html2canvas(svgElement, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'mermaid-mindmap.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export successful",
          description: "Mindmap exported as PNG"
        });
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
    if (!mermaidContainerRef.current) return;
    
    try {
      const container = mermaidContainerRef.current;
      const svgElement = container.querySelector('svg');
      
      if (svgElement) {
        // Create a canvas from the SVG
        const canvas = await html2canvas(svgElement, {
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
        pdf.text(`MapMyPaper - Mermaid Mindmap`, pdfWidth / 2, 10, { align: 'center' });
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
        
        // Save PDF
        pdf.save('mermaid-mindmap.pdf');
        
        toast({
          title: "Export successful",
          description: "Mindmap exported as PDF"
        });
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
          <DialogTitle>Mermaid Mindmap Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Syntax editor */}
          <div className="w-full md:w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">Edit Mindmap Syntax</p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleGenerateFromPaper}
                  disabled={isGenerating || !isPdfLoaded}
                  className="text-xs h-8"
                  title={!isPdfLoaded ? "Upload a PDF first to enable this feature" : ""}
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-3 w-3 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : "Generate from Paper"}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={handleExportPNG} className="flex items-center gap-2 cursor-pointer">
                      <Image className="h-4 w-4" />
                      <span>Export as PNG</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF} className="flex items-center gap-2 cursor-pointer">
                      <FilePdf className="h-4 w-4" />
                      <span>Export as PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Textarea 
              className="flex-1 font-mono text-sm resize-none overflow-auto"
              value={mermaidSyntax}
              onChange={handleSyntaxChange}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              <p className="font-semibold">Syntax Tips:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Indentation defines hierarchy (children indented more than parents)</li>
                <li>Node shapes: default (text), circle: ((text)), square: [text], rounded: (text), hexagon: {"{{text}}"})</li>
                <li>Use different shapes to represent different types of information</li>
                <li>Keep node text concise for better readability</li>
                <li>Use double parentheses ((text)) for main topics</li>
              </ul>
            </div>
          </div>
          
          {/* Mindmap preview */}
          <div className="w-full md:w-3/5 border rounded-md p-4 overflow-auto bg-white">
            <p className="text-sm text-muted-foreground mb-2">Preview</p>
            <div className="mermaid-container overflow-auto">
              <div ref={mermaidContainerRef} className="mermaid-render"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindMapModal;
