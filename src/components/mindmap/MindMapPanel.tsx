
import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, ZoomIn, ZoomOut, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { getPdfImages } from "@/utils/pdfStorage";

// Import MindElixir
import MindElixir, { MindElixirInstance, MindElixirData } from 'mind-elixir';
import nodeMenu from '@mind-elixir/node-menu';
import { downloadMindMapAsPNG } from '@/lib/export-utils';

interface MindMapPanelProps {
  onMindMapReady?: (instance: MindElixirInstance) => void;
  pdfKey?: string | null;
  hasExtractedImages?: boolean;
}

const MindMapPanel = ({ onMindMapReady, pdfKey, hasExtractedImages = false }: MindMapPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<MindElixirInstance | null>(null);
  const { toast: uiToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  
  const mindMapKeyPrefix = "mindMapData_";
  
  useEffect(() => {
    let instance: MindElixirInstance | null = null;
    let currentPdfKey = pdfKey;
    
    const loadMindMapData = async () => {
      setIsLoading(true);
      
      // Try to get the PDF key from location state, session storage, or props
      if (!currentPdfKey) {
        currentPdfKey = sessionStorage.getItem('currentPdfKey');
      }
      
      if (!currentPdfKey) {
        setLoadError("No PDF data found. Please generate a mindmap first.");
        setIsLoading(false);
        return;
      }
      
      try {
        // Get mindmap data from session storage
        const mindMapDataStr = sessionStorage.getItem(`${mindMapKeyPrefix}${currentPdfKey}`);
        
        if (!mindMapDataStr) {
          setLoadError("No mindmap data found for the selected PDF. Please generate a mindmap first.");
          setIsLoading(false);
          return;
        }
        
        const mindMapData: MindElixirData = JSON.parse(mindMapDataStr);
        
        // If the container isn't ready yet or already has a mind map, don't proceed
        if (!containerRef.current || containerRef.current.childElementCount > 0) {
          return;
        }
        
        // Check if we have extracted images for this PDF
        if (hasExtractedImages) {
          const extractedImages = await getPdfImages(currentPdfKey);
          console.log("Extracted images for mind map:", extractedImages);
        }
        
        // Initialize MindElixir with data
        instance = new MindElixir({
          el: containerRef.current,
          direction: MindElixir.LEFT,
          data: mindMapData,
          draggable: true,
          contextMenu: true,
          toolBar: true,
          nodeMenu: true,
          keypress: true,
          allowPrevRoot: true,
          locale: 'en',
          overflowHidden: false,
          primaryLinkStyle: 2,
          primaryNodeHorizontalGap: 50,
          primaryNodeVerticalGap: 25,
          contextMenuOption: {
            focus: true,
            link: true,
            extend: [
              {
                name: 'Custom',
                onclick: () => {
                  alert('Custom menu clicked');
                },
              },
            ],
          },
          before: {
            insertSibling(el, obj) {
              return true;
            },
            addChild(el, obj) {
              return true;
            },
          },
        });

        // Add the node menu plugin
        instance.install(nodeMenu);
        
        // Initialize the mind map
        instance.init();
        
        // Store the instance for access in other methods
        mindElixirRef.current = instance;
        
        // Callback to parent
        if (onMindMapReady) {
          onMindMapReady(instance);
        }
        
        // Listen for node clicks to scroll PDF
        instance.bus.addListener('nodeClick', (node: any) => {
          console.log('Node clicked:', node);
          
          // If the node has a page number reference, scroll to that page
          if (typeof node.pageTitles === 'object' && node.pageTitles?.pageNumber) {
            const pageNumber = parseInt(node.pageTitles.pageNumber, 10);
            if (!isNaN(pageNumber) && pageNumber > 0) {
              window.dispatchEvent(new CustomEvent('scrollToPdfPage', { 
                detail: { pageNumber }
              }));
            }
          }
        });
        
        // Successfully loaded the mind map
        setLoadError(null);
        setIsLoading(false);
        
        toast.success("Mind map loaded", {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error initializing mind map:", error);
        setLoadError("Failed to initialize mind map. Please try refreshing the page.");
        setIsLoading(false);
        
        uiToast({
          title: "Error",
          description: "Failed to load mind map data",
          variant: "destructive",
        });
      }
    };
    
    loadMindMapData();
    
    // Cleanup function
    return () => {
      if (instance) {
        try {
          // Store data before unmounting
          const data = instance.getData('nodeData');
          if (currentPdfKey && data) {
            sessionStorage.setItem(
              `${mindMapKeyPrefix}${currentPdfKey}`, 
              JSON.stringify({nodeData: data})
            );
          }
          
          // Clean up event listeners
          instance.bus.removeListener('nodeClick');
          mindElixirRef.current = null;
        } catch (e) {
          console.error("Error in mindmap cleanup:", e);
        }
      }
    };
  }, [onMindMapReady, pdfKey, hasExtractedImages, uiToast]);
  
  const zoomIn = () => {
    if (mindElixirRef.current) {
      mindElixirRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mindElixirRef.current) {
      mindElixirRef.current.zoomOut();
    }
  };

  const downloadImage = () => {
    if (mindElixirRef.current) {
      try {
        // Generate an image of the mind map
        const dataUrl = mindElixirRef.current.exportImg();
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `mindmap-${timestamp}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Mind map image downloaded", {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error exporting mind map image:", error);
        uiToast({
          title: "Error",
          description: "Failed to export mind map as image",
          variant: "destructive",
        });
      }
    }
  };

  const refreshLayout = () => {
    if (mindElixirRef.current) {
      try {
        mindElixirRef.current.refresh();
        toast.success("Layout refreshed", {
          position: "top-center",
        });
      } catch (error) {
        console.error("Error refreshing layout:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white min-h-0 relative">
      <div className="flex justify-between items-center border-b p-1.5 gap-1 z-10">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0" 
                onClick={zoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0" 
                onClick={zoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0" 
                onClick={refreshLayout}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh layout</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0" 
                onClick={downloadImage}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download as image</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 relative min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : loadError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-md text-center">
              <p className="text-red-500 font-medium mb-4">{loadError}</p>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Go to Upload Page
              </Button>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default MindMapPanel;
