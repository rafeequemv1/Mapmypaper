
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
import { RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart } = useFlowchartGenerator();
  const { toast } = useToast();
  
  // State for theme and UI
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [zoomLevel, setZoomLevel] = useState(0.8); // Start with 80% zoom to ensure it fits
  const [isRendering, setIsRendering] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const mountedRef = useRef(true);
  
  // PDF tab state
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });
  
  // Always initialize mermaid library with horizontal layout
  useMermaidInit("LR"); 
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Handle active PDF change
  const handleTabChange = (key: string) => {
    setActivePdfKey(key);
    // Notify other components about PDF switch
    window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: key } }));
    // Regenerate flowchart for the selected PDF
    setIsRendering(true);
    generateFlowchart(key)
      .then(() => {
        if (mountedRef.current) {
          console.log("Flowchart generated for new PDF");
        }
      })
      .catch(err => {
        console.error("Error generating flowchart for new PDF:", err);
      })
      .finally(() => {
        if (mountedRef.current) {
          setIsRendering(false);
        }
      });
  };
  
  // Force a new flowchart generation when modal is opened
  useEffect(() => {
    if (open && mountedRef.current) {
      console.log("Flowchart modal opened, generating flowchart...");
      // Reset attempted state to force regeneration
      setInitialLoadAttempted(false);
      
      // Small delay to ensure modal is fully opened
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setIsRendering(true);
          generateFlowchart(activePdfKey)
            .then(() => {
              console.log("Flowchart generated successfully");
            })
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
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, generateFlowchart, toast, activePdfKey]);

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
    generateFlowchart(activePdfKey)
      .then(() => {
        console.log("Flowchart regenerated successfully");
      })
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
        
        {/* PDF Tabs */}
        <PdfTabs
          activeKey={activePdfKey}
          onTabChange={handleTabChange}
          onRemove={() => {}} // No removal in this view
        />
        
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
              <span className="text-xs">{Math.round(zoomLevel * 100)}%</span>
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
        
        <div className="flex-1 overflow-hidden border rounded-md">
          {/* Preview - Takes up all space */}
          <div className="h-full flex flex-col">
            <FlowchartPreview
              code={code || defaultFlowchart}
              error={error}
              isGenerating={isGenerating || isRendering}
              theme={theme}
              previewRef={previewRef}
              zoomLevel={zoomLevel}
              hideEditor={true}
              onRetry={handleRetry}
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
