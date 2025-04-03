
import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MindmapModal({ isOpen, onClose }: MindmapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  
  // Demo mindmap code
  const mindmapCode = `mindmap
  root((Mindmap))
    Origins
      Long history
      Popularization
        British psychology author Tony Buzan
    Research
      On effectiveness
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`;

  // Render the diagram when modal opens or theme changes
  useEffect(() => {
    if (!isOpen) return;
    
    const renderMermaid = async () => {
      try {
        setIsRendering(true);
        setError(null);
        
        // Import mermaid dynamically to ensure it's only loaded when needed
        const mermaid = (await import('mermaid')).default;
        
        // Configure mermaid with the current theme
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme,
          mindmap: {
            padding: 16,
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          }
        });
        
        // Clear previous rendering
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          
          // Create a unique ID for this render
          const id = `mindmap-diagram-${Math.random().toString(36).substring(2, 11)}`;
          
          // Create the pre element that will contain our diagram
          const preElement = document.createElement('pre');
          preElement.className = 'mermaid';
          preElement.textContent = mindmapCode;
          containerRef.current.appendChild(preElement);
          
          // Render the diagram - using the newer API pattern
          await mermaid.run({
            nodes: [preElement],
            suppressErrors: false
          });
          
          // Find the SVG and make it responsive
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '60vh';
            
            // Add custom styles for mindmap nodes
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = `
              .mindmap-node > rect, .mindmap-node > circle, .mindmap-node > ellipse {
                rx: 10px;
                ry: 10px;
                fill-opacity: 0.8 !important;
              }
              .mindmap-node .label {
                font-size: 14px;
                font-weight: 500;
              }
              .mindmap-root > rect, .mindmap-root > circle, .mindmap-root > ellipse {
                fill: #E5DEFF !important;
                stroke: #8B5CF6 !important;
              }
              .edge {
                stroke-width: 2px !important;
              }
            `;
            svgElement.appendChild(styleElement);
          }
        }
      } catch (err) {
        console.error("Error rendering Mermaid diagram:", err);
        setError(String(err));
      } finally {
        setIsRendering(false);
      }
    };
    
    renderMermaid();
    
    // Clean up function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, theme, mindmapCode]);

  // Toggle through available themes
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Function to manually re-render the diagram
  const reRenderDiagram = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    
    // Force a re-render by changing a dependency the useEffect relies on
    setTheme(prevTheme => {
      // Re-apply the same theme to trigger re-render
      return prevTheme;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription>
            An interactive visualization of mindmap concepts
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-4">
          <div 
            className="mermaid-container w-full min-h-[300px] max-h-[50vh] flex items-center justify-center bg-white rounded-md border overflow-auto"
          >
            {isRendering && (
              <div className="text-gray-500 flex flex-col items-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                <div>Loading mindmap...</div>
              </div>
            )}
            
            {error && (
              <div className="p-6 text-red-500 bg-red-50 rounded-md border border-red-200">
                <p className="font-semibold mb-2">Error rendering mindmap:</p>
                <pre className="text-sm overflow-auto">{error}</pre>
              </div>
            )}
            
            <div 
              ref={containerRef} 
              className={`w-full h-full flex items-center justify-center ${isRendering ? 'hidden' : ''}`}
            />
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Diagram Source Code:</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-[15vh] overflow-y-auto">
              {mindmapCode}
            </pre>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <div className="flex items-center gap-2 w-full justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Theme: {theme}
            </Button>
            <Button onClick={reRenderDiagram} disabled={isRendering}>
              {isRendering ? 'Rendering...' : 'Refresh Diagram'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
