
import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw } from "lucide-react";
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

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MindmapModal({ isOpen, onClose }: MindmapModalProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  const isMounted = useRef(true);
  const containerId = useRef(`mindmap-diagram-${Math.random().toString(36).substring(2, 11)}`);
  
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

  // Initialize mermaid only on component mount
  useEffect(() => {
    console.log("MindmapModal mounted");
    
    // Clean up function to handle unmounting
    return () => {
      console.log("MindmapModal unmounted");
      isMounted.current = false;
      
      // Clear any existing content
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
      }
    };
  }, []);
  
  // Handle the modal opening and closing
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, initializing mermaid");
      setError(null);
      
      try {
        // Initialize mermaid with the current theme and proper configuration
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme,
          mindmap: {
            padding: 16,
            useMaxWidth: true
          },
          flowchart: {
            useMaxWidth: true
          }
        });
        
        // Render after a short delay to ensure DOM is ready
        setTimeout(() => {
          if (isMounted.current && mermaidRef.current) {
            renderMindmap();
          }
        }, 200);
      } catch (err) {
        console.error("Error initializing mermaid:", err);
        setError(String(err));
      }
    }
  }, [isOpen, theme]);
  
  // Function to render the mindmap diagram
  const renderMindmap = async () => {
    if (!mermaidRef.current || !isMounted.current || !isOpen) return;
    
    setIsRendering(true);
    console.log("Rendering mindmap...");
    
    try {
      // Clear previous content safely
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
      }
      
      const id = containerId.current;
      
      // Use a try-catch block for the actual rendering to handle errors properly
      try {
        const { svg } = await mermaid.render(id, mindmapCode);
        
        // Safety check before updating DOM
        if (!isMounted.current || !mermaidRef.current || !isOpen) {
          console.log("Component unmounted or modal closed during render, aborting");
          return;
        }
        
        // Insert the SVG content
        mermaidRef.current.innerHTML = svg;
        
        // Post-process SVG for better appearance
        const svgElement = mermaidRef.current.querySelector('svg');
        if (svgElement) {
          // Make SVG responsive and ensure it fits within the container
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.maxWidth = '100%';
          svgElement.style.maxHeight = '60vh'; // Limit height to fit in modal
          
          // Add custom styles for mindmap nodes
          const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
          styleElement.textContent = `
            .mindmap-node > rect, .mindmap-node > circle, .mindmap-node > ellipse, .mindmap-node > polygon {
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
        console.log("Mindmap rendered successfully");
      } catch (renderError) {
        console.error("Error during mermaid render:", renderError);
        setError(String(renderError));
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="p-6 text-red-500 bg-red-50 rounded-md border border-red-200">
              <p class="font-semibold mb-2">Error rendering mindmap:</p>
              <pre class="text-sm overflow-auto">${String(renderError)}</pre>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("Error in renderMindmap function:", error);
      
      if (isMounted.current && mermaidRef.current) {
        setError(String(error));
        mermaidRef.current.innerHTML = `
          <div class="p-6 text-red-500 bg-red-50 rounded-md border border-red-200">
            <p class="font-semibold mb-2">Error rendering mindmap:</p>
            <pre class="text-sm overflow-auto">${String(error)}</pre>
          </div>
        `;
      }
    } finally {
      if (isMounted.current) {
        setIsRendering(false);
      }
    }
  };

  // Toggle through available themes
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
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
            ref={mermaidRef} 
            className="mermaid-container w-full min-h-[300px] max-h-[50vh] flex items-center justify-center bg-white rounded-md border overflow-auto"
          >
            {isRendering && (
              <div className="text-gray-500 flex flex-col items-center p-8">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
                <div>Loading mindmap...</div>
              </div>
            )}
            {!isRendering && !error && !mermaidRef.current?.innerHTML && (
              <div className="text-gray-400 p-8">Mindmap will appear here</div>
            )}
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
            <Button onClick={renderMindmap} disabled={isRendering}>
              {isRendering ? 'Rendering...' : 'Refresh Diagram'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
