
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
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useFlowchartGenerator, { defaultFlowchart } from "./flowchart/useFlowchartGenerator";
import { Loader2, ZoomIn, ZoomOut, MousePointer, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  const { toast } = useToast();
  
  // State for theme and UI
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [hideEditor, setHideEditor] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(0.8); // Start with 80% zoom to ensure it fits
  const [isRendering, setIsRendering] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const mountedRef = useRef(true);
  
  // Always initialize mermaid library with horizontal layout
  useMermaidInit("LR"); 
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open && !initialLoadAttempted && mountedRef.current) {
      // Ensure mermaid is available before attempting to generate flowchart
      setTimeout(() => {
        if (mountedRef.current) {
          setIsRendering(true);
          generateFlowchart()
            .catch(err => {
              console.error("Error in flowchart generation:", err);
              if (mountedRef.current) {
                toast({
                  title: "Flowchart Generation Issue",
                  description: "There was a problem creating the flowchart. A simplified view is shown instead.",
                  variant: "destructive",
                });
              }
            })
            .finally(() => {
              if (mountedRef.current) {
                setIsRendering(false);
                setInitialLoadAttempted(true);
              }
            });
        }
      }, 800); // Increased delay to ensure modal is fully opened and libraries are loaded
    }
  }, [open, generateFlowchart, initialLoadAttempted, toast]);

  // Reset initial load when modal closes
  useEffect(() => {
    if (!open) {
      // Reset for next opening
      setInitialLoadAttempted(false);
    }
  }, [open]);

  // Toggle color theme
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(0.8); // Reset to 80% to ensure diagram fits
  };

  // Fit diagram to screen when window is resized
  useEffect(() => {
    const handleResize = () => {
      // Reset zoom to ensure diagram fits
      setZoomLevel(0.8);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle retry for generation failures
  const handleRetry = () => {
    setIsRendering(true);
    generateFlowchart()
      .catch(err => {
        console.error("Retry failed:", err);
        if (mountedRef.current) {
          toast({
            title: "Retry Failed",
            description: "Still having trouble generating the flowchart. Using simplified view.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsRendering(false);
        }
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart View</DialogTitle>
          <DialogDescription>
            View flowcharts visualizing processes and relationships from your document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
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
              title="Reset zoom to fit diagram"
            >
              <MousePointer className="h-4 w-4 mr-1" />
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
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="flex items-center gap-1 ml-auto"
            disabled={isGenerating || isRendering}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating || isRendering ? 'animate-spin' : ''}`} />
            {error ? "Retry Generation" : "Refresh Flowchart"}
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden border border-gray-200 rounded-md bg-white">
          {/* Preview - Takes up all space */}
          <div className="h-full flex flex-col relative">
            <FlowchartPreview
              code={code || defaultFlowchart}
              error={error}
              isGenerating={isGenerating || isRendering}
              theme={theme}
              previewRef={previewRef}
              zoomLevel={zoomLevel}
              hideEditor={true}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} onToggleTheme={toggleTheme} />
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
