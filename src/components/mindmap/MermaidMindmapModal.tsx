import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw, Download, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import { generateMindmapFromPdf } from "@/services/geminiService";

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const [showSyntax, setShowSyntax] = useState(false); // Toggle for showing syntax code
  const { toast } = useToast();
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap code when modal is opened
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Creating a mindmap visualization from your document...",
      });
      
      // Get PDF content from the Gemini API
      generateMindmapFromPdf()
        .then((mindmapCode) => {
          if (mindmapCode) {
            // Make sure the mindmap code starts with the mindmap declaration
            let formattedCode = mindmapCode;
            if (!formattedCode.trim().startsWith("mindmap")) {
              formattedCode = `mindmap\n${formattedCode}`;
            }
            
            // Fix common syntax issues
            formattedCode = fixMindmapSyntax(formattedCode);
            
            setMermaidCode(formattedCode);
            toast({
              title: "Mindmap Generated",
              description: "Your mindmap has been successfully generated"
            });
          } else {
            throw new Error("Failed to generate mindmap");
          }
        })
        .catch((error) => {
          console.error("Error generating mindmap:", error);
          toast({
            title: "Error",
            description: "Failed to generate mindmap. Using default structure.",
            variant: "destructive"
          });
          // Set default mindmap on failure with proper syntax
          setMermaidCode(`mindmap
  root((Document Overview))
    Origins
      Introduction
        Background
        Problem Statement
      Methodology
        Approach
        Data Collection
    Key Concepts
      Concept 1
        Sub-concept 1.1
        Sub-concept 1.2
      Concept 2
        Sub-concept 2.1
        Sub-concept 2.2
    Supporting Evidence
      Data Points
        Primary Findings
        Secondary Results
      Analysis
        Statistical Methods
        Interpretations`);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [open, toast]);

  // Fix common syntax issues in Mermaid mindmap code
  const fixMindmapSyntax = (code: string): string => {
    // Split the code into lines
    const lines = code.split('\n');
    const processedLines: string[] = [];
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        processedLines.push('');
        continue;
      }
      
      // Keep mindmap declaration
      if (line.trim() === "mindmap") {
        processedLines.push(line);
        continue;
      }
      
      // If line contains "Mindmap:" or similar instructional text, skip it
      if (line.includes("Mindmap:") || line.includes("syntax") || line.includes("example")) {
        continue;
      }
      
      // Ensure proper indentation using spaces (not tabs)
      if (!line.startsWith(" ") && !line.trim().startsWith("mindmap")) {
        line = "  " + line;
      }
      
      // Check for node shapes
      if (!line.includes("[") && !line.includes("(") && !line.includes("{") && 
          !line.includes(")") && line.includes(":")) {
        // Replace colons with proper node syntax
        line = line.replace(/:\s*/, " ");
      }
      
      processedLines.push(line);
    }
    
    return processedLines.join('\n');
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Toggle syntax view
  const toggleSyntaxView = () => {
    setShowSyntax(prev => !prev);
  };

  // Handle export as PNG
  const handleExportAsPNG = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current);
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'mermaid-mindmap.png';
      link.click();
      
      toast({
        title: "Export successful",
        description: "Mermaid mindmap exported as PNG"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export mindmap",
        variant: "destructive"
      });
    }
  };

  // Handle code editing in syntax view
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidCode(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap using Mermaid.
          </DialogDescription>
        </DialogHeader>
        
        {/* Toolbar with zoom controls and syntax toggle */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="flex items-center gap-1"
            title="Reset zoom"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center gap-1"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSyntaxView}
            className="flex items-center gap-1 ml-auto"
          >
            <Code className="h-4 w-4 mr-1" />
            {showSyntax ? "Hide Syntax" : "Show Syntax"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportAsPNG}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>
        </div>
        
        {/* Mindmap Preview or Syntax View */}
        <div className="flex-1 overflow-auto bg-white rounded-md p-4 border">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Generating mindmap...</p>
              </div>
            </div>
          ) : showSyntax ? (
            // Syntax code view with edit capability
            <div className="h-full w-full bg-gray-50 rounded overflow-auto p-4">
              <textarea 
                className="text-sm font-mono w-full h-full p-2 bg-gray-50 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={mermaidCode}
                onChange={handleCodeChange}
              />
            </div>
          ) : (
            // Mindmap preview
            <div 
              ref={previewRef} 
              className="min-h-full h-full w-full flex items-center justify-center overflow-hidden"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <div className="mermaid bg-white p-6 rounded-lg w-full h-full flex items-center justify-center">
                {mermaidCode}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindmapModal;
