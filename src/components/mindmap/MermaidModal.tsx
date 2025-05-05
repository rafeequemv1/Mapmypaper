
import React, { useEffect, useRef, useState } from "react";
import { Copy, Download, X } from "lucide-react";
import mermaid from "mermaid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToMermaidFlowchart, convertToMermaidMindmap } from "@/utils/mermaidConverter";
import { useToast } from "@/hooks/use-toast";
import { MindElixirInstance } from "mind-elixir";

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  mindMapInstance: MindElixirInstance | null;
  pdfKey: string | null;
}

export function MermaidModal({ isOpen, onClose, mindMapInstance, pdfKey }: MermaidModalProps) {
  const flowchartContainerRef = useRef<HTMLDivElement>(null);
  const mindmapContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("flowchart");
  const [mermaidFlowchart, setMermaidFlowchart] = useState<string>("");
  const [mermaidMindmap, setMermaidMindmap] = useState<string>("");
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        htmlLabels: true,
        curve: 'linear',
      },
      securityLevel: 'loose',
    });
  }, []);

  // Generate and render mermaid diagrams when modal opens
  useEffect(() => {
    if (isOpen && mindMapInstance) {
      setIsRendering(true);
      setError(null);
      
      try {
        // Get data from mindmap
        const data = mindMapInstance.getData();
        
        // Convert to different mermaid formats
        const flowchartCode = convertToMermaidFlowchart(data);
        const mindmapCode = convertToMermaidMindmap(data);
        
        setMermaidFlowchart(flowchartCode);
        setMermaidMindmap(mindmapCode);
        
        setTimeout(() => {
          renderMermaid();
          setIsRendering(false);
        }, 100);
      } catch (err) {
        console.error("Error generating mermaid diagrams:", err);
        setError(`Failed to generate diagrams: ${err instanceof Error ? err.message : String(err)}`);
        setIsRendering(false);
      }
    }
  }, [isOpen, mindMapInstance, activeTab]);
  
  // Function to render mermaid diagrams
  const renderMermaid = async () => {
    try {
      if (!isOpen) return;
      
      if (activeTab === "flowchart" && flowchartContainerRef.current && mermaidFlowchart) {
        flowchartContainerRef.current.innerHTML = '';
        await mermaid.render('flowchart-diagram', mermaidFlowchart, (svgCode) => {
          if (flowchartContainerRef.current) {
            flowchartContainerRef.current.innerHTML = svgCode;
          }
        });
      }
      
      if (activeTab === "mindmap" && mindmapContainerRef.current && mermaidMindmap) {
        mindmapContainerRef.current.innerHTML = '';
        await mermaid.render('mindmap-diagram', mermaidMindmap, (svgCode) => {
          if (mindmapContainerRef.current) {
            mindmapContainerRef.current.innerHTML = svgCode;
          }
        });
      }
    } catch (err) {
      console.error("Error rendering mermaid:", err);
      setError(`Failed to render diagram: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Re-render when tab changes
  useEffect(() => {
    if (isOpen) {
      renderMermaid();
    }
  }, [activeTab, isOpen]);

  // Copy mermaid code to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Diagram code copied successfully",
        });
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      });
  };

  // Export diagram as PNG
  const exportAsPNG = (diagramType: string) => {
    try {
      const containerRef = diagramType === 'flowchart' 
        ? flowchartContainerRef.current 
        : mindmapContainerRef.current;
        
      if (!containerRef) return;
      
      const svg = containerRef.querySelector('svg');
      if (!svg) {
        toast({
          title: "Export failed",
          description: "No diagram found to export",
          variant: "destructive",
        });
        return;
      }
      
      // Create a canvas and draw the SVG on it
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Convert canvas to PNG and trigger download
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `mindmap-${diagramType}-${new Date().toISOString().slice(0, 10)}.png`;
        downloadLink.click();
        
        toast({
          title: "Export successful",
          description: `Diagram exported as PNG`,
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export failed",
        description: "Could not export the diagram",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mermaid Diagram View</DialogTitle>
          <DialogDescription>
            Alternative visualization of your mind map
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="flowchart">Flowchart View</TabsTrigger>
            <TabsTrigger value="mindmap">Mindmap View</TabsTrigger>
            <TabsTrigger value="code">Raw Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flowchart" className="flex-1 overflow-auto border rounded-md p-4">
            {isRendering ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                {error}
              </div>
            ) : (
              <div className="overflow-auto h-full flex flex-col">
                <div className="flex justify-end gap-2 mb-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(mermaidFlowchart)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportAsPNG('flowchart')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export PNG
                  </Button>
                </div>
                <div 
                  ref={flowchartContainerRef}
                  className="flex-1 overflow-auto flex items-center justify-center"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mindmap" className="flex-1 overflow-auto border rounded-md p-4">
            {isRendering ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                {error}
              </div>
            ) : (
              <div className="overflow-auto h-full flex flex-col">
                <div className="flex justify-end gap-2 mb-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(mermaidMindmap)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportAsPNG('mindmap')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export PNG
                  </Button>
                </div>
                <div 
                  ref={mindmapContainerRef}
                  className="flex-1 overflow-auto flex items-center justify-center"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="code" className="flex-1 overflow-auto border rounded-md p-4">
            <div className="h-full flex flex-col">
              <Tabs defaultValue="flowchart" className="w-full h-full flex flex-col">
                <TabsList>
                  <TabsTrigger value="flowchart">Flowchart Code</TabsTrigger>
                  <TabsTrigger value="mindmap">Mindmap Code</TabsTrigger>
                </TabsList>
                <TabsContent value="flowchart" className="flex-1 mt-2">
                  <div className="flex justify-end mb-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyToClipboard(mermaidFlowchart)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto h-[50vh] whitespace-pre-wrap">
                    {mermaidFlowchart}
                  </pre>
                </TabsContent>
                <TabsContent value="mindmap" className="flex-1 mt-2">
                  <div className="flex justify-end mb-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyToClipboard(mermaidMindmap)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto h-[50vh] whitespace-pre-wrap">
                    {mermaidMindmap}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-2">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
