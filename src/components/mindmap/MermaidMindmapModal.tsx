import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { Download, RefreshCw, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import mermaid from "mermaid";

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const [mindmapCode, setMindmapCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize mermaid with specific config for mindmaps
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      mindmap: {
        padding: 16,
        useMaxWidth: true
      },
      logLevel: 'debug' // Use debug level to help troubleshooting
    });
  }, []);

  // Clean up when modal closes
  useEffect(() => {
    if (!open) {
      setIsRendered(false);
      
      // Safe cleanup of container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [open]);

  // Generate mindmap when modal opens
  useEffect(() => {
    if (open) {
      generateMindmap();
    }
  }, [open]);

  // Update editor content when mindmap code changes
  useEffect(() => {
    if (mindmapCode) {
      setEditorContent(mindmapCode);
    }
  }, [mindmapCode]);

  // Render mindmap whenever code changes
  useEffect(() => {
    if (!editorContent || !open || !containerRef.current) return;
    
    // Use a timeout to ensure the DOM is ready
    const renderTimeout = setTimeout(() => {
      renderMindmap();
    }, 300);
    
    return () => {
      clearTimeout(renderTimeout);
    };
  }, [editorContent, open]);

  // Safe method to clear the container
  const clearContainer = () => {
    if (containerRef.current) {
      // Instead of using innerHTML, safely remove each child node
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }
  };

  // Separate render function for the mindmap
  const renderMindmap = async () => {
    if (!containerRef.current) return;
    
    try {
      // Safely clear previous content
      clearContainer();
      
      // Generate a unique ID for this rendering
      const id = `mindmap-${Date.now()}`;
      
      // Create a new div for mermaid to render into
      const renderDiv = document.createElement('div');
      renderDiv.id = id;
      renderDiv.className = "w-full h-full";
      
      // Only append if containerRef still exists
      if (containerRef.current) {
        containerRef.current.appendChild(renderDiv);
        
        try {
          // Ensure proper mindmap syntax
          const processedCode = ensureProperMindmapSyntax(editorContent);
          
          // Debug the code being rendered
          console.debug("Rendering mindmap with code:", processedCode);
          
          // Check if element still exists before rendering
          const element = document.getElementById(id);
          if (element) {
            const { svg } = await mermaid.render(id, processedCode);
            
            // Check again if the element exists before updating
            const updatedElement = document.getElementById(id);
            if (updatedElement) {
              updatedElement.innerHTML = svg;
              setIsRendered(true);
            }
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          
          // Try with a simpler fallback mindmap that's sure to work
          const fallbackMindmap = `mindmap
  root((Document))
    Key Concepts
    Main Findings`;
          
          // Check if element still exists before retrying
          const element = document.getElementById(id);
          if (element) {
            try {
              const { svg } = await mermaid.render(id, fallbackMindmap);
              
              const updatedElement = document.getElementById(id);
              if (updatedElement) {
                updatedElement.innerHTML = svg;
                setIsRendered(true);
                
                toast({
                  title: "Using simplified mindmap",
                  description: "The full mindmap couldn't be rendered due to syntax issues. Please check your syntax.",
                  variant: "default"
                });
              }
            } catch (fallbackError) {
              console.error("Fallback mindmap rendering error:", fallbackError);
              
              const element = document.getElementById(id);
              if (element) {
                element.innerHTML = '<div class="text-red-500 p-4">Failed to render mindmap due to syntax errors. Please check your mindmap syntax.</div>';
              }
              
              toast({
                title: "Rendering Error",
                description: "Failed to render the mindmap. Check syntax in the editor.",
                variant: "destructive"
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Mermaid processing error:", error);
    }
  };

  // Ensure proper mindmap syntax - focusing on the indentation
  const ensureProperMindmapSyntax = (code: string): string => {
    // Ensure code starts with mindmap declaration
    if (!code.trim().startsWith("mindmap")) {
      code = "mindmap\n" + code;
    }
    
    // Split into lines and normalize indentation
    const lines = code.split('\n');
    const processedLines = [];
    
    // Add the mindmap declaration
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Keep mindmap declaration as-is
      if (line.trim() === "mindmap") {
        processedLines.push(line);
        continue;
      }
      
      // For other lines, ensure proper indentation
      // Replace any mix of spaces/tabs with consistent 2-space indentation
      const indentMatch = line.match(/^(\s*)/);
      const indentLevel = indentMatch ? Math.floor(indentMatch[0].length / 2) : 0;
      
      // Re-indent with consistent spacing (2 spaces per level)
      const normalizedLine = "  ".repeat(indentLevel) + line.trim();
      processedLines.push(normalizedLine);
    }
    
    return processedLines.join('\n');
  };

  // Generate the mindmap using Gemini API
  const generateMindmap = async () => {
    setIsLoading(true);
    setIsRendered(false);
    
    // Clear existing content
    clearContainer();
    
    try {
      let mindmapText = await generateMindmapFromPdf();
      
      // Fix common syntax issues
      mindmapText = ensureProperMindmapSyntax(mindmapText);
      
      setMindmapCode(mindmapText);
    } catch (error) {
      console.error("Error generating mindmap:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate mindmap from the PDF",
        variant: "destructive"
      });
      
      // Set a simple valid mindmap as fallback
      setMindmapCode(`mindmap
  root((Document))
    Failed to generate mindmap
      Please try again`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changes in the editor
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };
  
  // Apply changes from the editor
  const applyChanges = () => {
    renderMindmap();
  };
  
  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied to clipboard",
      description: "Mindmap code has been copied to your clipboard"
    });
  };

  // Function to export the mindmap as SVG
  const exportAsSVG = () => {
    const svgElement = containerRef.current?.querySelector("svg");
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = "mindmap.svg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      
      toast({
        title: "Export successful",
        description: "Mermaid mindmap exported as SVG"
      });
    } else {
      toast({
        title: "Export failed",
        description: "Mindmap is not available for export",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Ensure we clean up when closing
      if (!newOpen && containerRef.current) {
        clearContainer();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex justify-between items-center flex-row">
          <DialogTitle>Document Mindmap</DialogTitle>
          <div className="flex gap-2">
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              size="sm" 
              className="flex gap-2 items-center"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Code"}
            </Button>
            <Button 
              onClick={generateMindmap}
              variant="outline" 
              size="sm" 
              className="flex gap-2 items-center"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button 
              onClick={exportAsSVG} 
              variant="outline" 
              size="sm" 
              className="flex gap-2 items-center"
              disabled={!isRendered}
            >
              <Download className="h-4 w-4" /> Export SVG
            </Button>
          </div>
        </DialogHeader>
        
        <DialogDescription className="text-sm text-center">
          {isLoading ? "Generating mindmap from your document..." : "Edit code on the left and see preview on the right"}
        </DialogDescription>
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64 w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex flex-row gap-4 h-full">
              {/* Editor Panel - Left side */}
              <div className="flex-1 h-full flex flex-col">
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="text-sm font-medium mb-2">Mindmap Syntax Editor</div>
                  <Textarea 
                    value={editorContent}
                    onChange={handleEditorChange}
                    className="font-mono text-sm h-full resize-none p-4 overflow-auto flex-1"
                    placeholder="mindmap
  root((My Document))
    Topic 1
      Subtopic 1.1
      Subtopic 1.2
    Topic 2
      Subtopic 2.1"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button onClick={applyChanges}>Apply Changes</Button>
                </div>
              </div>
              
              {/* Preview Panel - Right side */}
              <div className="flex-1 h-full">
                <div className="text-sm font-medium mb-2">Mindmap Preview</div>
                <div className="border rounded-md overflow-auto h-[calc(100%-2rem)]">
                  <div 
                    ref={containerRef}
                    className="mermaid-mindmap w-full h-full min-h-[500px] flex justify-center items-center overflow-auto p-4"
                  >
                    {!isRendered && !isLoading && (
                      <div className="text-gray-500">Rendering mindmap...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindmapModal;
