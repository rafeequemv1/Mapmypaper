
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
  const [mermaidInitialized, setMermaidInitialized] = useState(false);
  
  // Stable container ID to avoid issues with re-renders
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

  // Initialize mermaid once when modal opens
  useEffect(() => {
    if (isOpen && !mermaidInitialized) {
      try {
        console.log("Initializing mermaid...");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme,
          mindmap: {
            padding: 16,
            useMaxWidth: false
          },
        });
        setMermaidInitialized(true);
      } catch (err) {
        console.error("Error initializing mermaid:", err);
      }
    }
    
    // Return cleanup function
    return () => {
      if (!isOpen) {
        // Reset the error state when modal is closed
        setError(null);
      }
    };
  }, [isOpen, mermaidInitialized, theme]);
  
  // Render the mindmap when theme changes or modal opens
  useEffect(() => {
    let isMounted = true;
    
    const renderMindmapWithDelay = async () => {
      if (!isOpen || !mermaidRef.current) return;
      
      // Add a small delay before rendering to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if component is still mounted and modal is still open
      if (!isMounted || !isOpen || !mermaidRef.current) return;
      
      renderMindmap();
    };
    
    if (isOpen && mermaidInitialized) {
      renderMindmapWithDelay();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, theme, mermaidInitialized]);

  // Function to render the mindmap diagram - separated for better control
  const renderMindmap = async () => {
    if (!isOpen || !mermaidRef.current) return;
    
    setIsRendering(true);
    setError(null);
    
    try {
      // Clear previous content
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
      }
      
      // Update mermaid configuration with current theme
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme,
          mindmap: {
            padding: 16,
            useMaxWidth: false
          },
          themeVariables: {
            primaryColor: '#8B5CF6',
            primaryTextColor: '#333',
            primaryBorderColor: '#6E59A5',
          }
        });
      } catch (err) {
        console.error("Error reinitializing mermaid with theme:", err);
      }
      
      // Generate SVG
      console.log("Rendering mindmap...");
      const id = containerId.current;
      const { svg } = await mermaid.render(id, mindmapCode);
      
      // Check if component is still mounted and modal is still open before updating DOM
      if (!isOpen || !mermaidRef.current) return;
      
      // Insert the SVG content
      mermaidRef.current.innerHTML = svg;
      
      // Post-process SVG for better appearance
      if (mermaidRef.current) {
        const svgElement = mermaidRef.current.querySelector('svg');
        if (svgElement) {
          // Make SVG responsive
          svgElement.setAttribute('width', '100%');
          svgElement.setAttribute('height', '100%');
          svgElement.style.maxWidth = '100%';
          
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
      }
      console.log("Mindmap rendered successfully");
    } catch (error) {
      console.error("Error rendering mindmap:", error);
      
      if (isOpen && mermaidRef.current) {
        setError(String(error));
        
        mermaidRef.current.innerHTML = `
          <div class="p-6 text-red-500 bg-red-50 rounded-md border border-red-200">
            <p class="font-semibold mb-2">Error rendering mindmap:</p>
            <pre class="text-sm overflow-auto">${String(error)}</pre>
          </div>
        `;
      }
    } finally {
      if (isOpen) {
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Mermaid Mindmap Demo</DialogTitle>
          <DialogDescription>
            An interactive visualization of mindmap concepts
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 overflow-auto">
          <div 
            ref={mermaidRef} 
            className="mermaid-container w-full min-h-[400px] flex items-center justify-center bg-white rounded-md border"
          >
            {isRendering && (
              <div className="text-gray-500 flex flex-col items-center">
                <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full mb-2"></div>
                <div>Loading mindmap...</div>
              </div>
            )}
            {!isRendering && !error && !mermaidRef.current?.innerHTML && (
              <div className="text-gray-400">Mindmap will appear here</div>
            )}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Diagram Source Code:</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {mindmapCode}
            </pre>
          </div>
        </div>
        <DialogFooter>
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
