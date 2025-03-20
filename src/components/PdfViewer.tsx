import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle, Camera, Lasso, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { fabric } from 'fabric';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
  onTogglePdf?: () => void;
  showPdf?: boolean;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
  onCaptureSnapshot?: (imageData: string) => void;
}

const PdfViewer = ({ 
  className, 
  onTogglePdf, 
  showPdf = true, 
  onExplainText,
  onRequestOpenChat,
  onCaptureSnapshot
}: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>("");
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Load PDF data from sessionStorage
  useEffect(() => {
    try {
      const storedPdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      if (storedPdfData) {
        console.log("PDF data loaded, length:", storedPdfData.length);
        setPdfData(storedPdfData);
      } else {
        console.error("No PDF data found in sessionStorage");
      }
    } catch (error) {
      console.error("Error loading PDF data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize fabric canvas when entering selection mode
  useEffect(() => {
    if (selectionMode && canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
        backgroundColor: 'rgba(0,0,0,0.2)'
      });
      
      // Create selection rectangle
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        fill: 'rgba(0, 123, 255, 0.2)',
        stroke: 'rgba(0, 123, 255, 0.8)',
        strokeWidth: 2,
        strokeUniform: true,
        cornerColor: 'rgba(0, 123, 255, 0.8)',
        cornerStrokeColor: 'white',
        cornerSize: 10,
        transparentCorners: false,
        hasRotatingPoint: false
      });
      
      canvas.add(rect);
      canvas.setActiveObject(rect);
      
      // Add mouse up handler to capture area when selection is done
      canvas.on('mouse:up', () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && !isCapturing) {
          captureSelectedArea();
        }
      });
      
      canvas.renderAll();
      
      setFabricCanvas(canvas);
      
      // Properly size the canvas
      if (currentPageRef.current) {
        const { width, height } = currentPageRef.current.getBoundingClientRect();
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
      }
      
      return () => {
        if (canvas) {
          canvas.dispose();
        }
      };
    }
  }, [selectionMode, canvasRef]);

  // Update canvas size when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvas && currentPageRef.current && selectionMode) {
        const { width, height } = currentPageRef.current.getBoundingClientRect();
        fabricCanvas.setWidth(width);
        fabricCanvas.setHeight(height);
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas, selectionMode]);

  // Handle successful document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Start area selection mode
  const startAreaSelection = () => {
    setSelectionMode(true);
    toast({
      title: "Selection Mode",
      description: "Click and drag to select an area. Release to capture.",
    });
  };

  // Cancel area selection mode
  const cancelAreaSelection = () => {
    setSelectionMode(false);
    setFabricCanvas(null);
  };

  // Capture the selected area
  const captureSelectedArea = async () => {
    if (!fabricCanvas || !currentPageRef.current) {
      toast({
        title: "Snapshot Error",
        description: "Cannot capture the selected area. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCapturing(true);
      
      // Get the active selection object
      const activeObject = fabricCanvas.getActiveObject();
      if (!activeObject) {
        throw new Error("No area selected");
      }

      // Get the coordinates of the selection
      const { left, top, width, height } = activeObject;
      
      // Use html2canvas to capture the current page
      const fullCanvas = await html2canvas(currentPageRef.current, {
        scale: window.devicePixelRatio * 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      
      // Create a new canvas for the cropped image
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      const ctx = croppedCanvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Draw only the selected portion to the new canvas
      ctx.drawImage(
        fullCanvas,
        left, top, width, height,
        0, 0, width, height
      );
      
      // Convert to base64 image
      const imageData = croppedCanvas.toDataURL('image/png');
      
      // Send to parent component
      if (onCaptureSnapshot) {
        onCaptureSnapshot(imageData);
      }

      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }

      // Exit selection mode
      setSelectionMode(false);
      setFabricCanvas(null);

      toast({
        title: "Area Captured",
        description: "Selected area has been sent to the chat panel.",
      });
    } catch (error) {
      console.error("Error capturing selected area:", error);
      toast({
        title: "Snapshot Failed",
        description: `Failed to capture the selected area: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Capture entire page
  const captureFullPage = async () => {
    if (!currentPageRef.current) {
      toast({
        title: "Snapshot Error",
        description: "Cannot capture the current page. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCapturing(true);
      toast({
        title: "Creating Snapshot",
        description: "Please wait while we capture the current page...",
      });

      // Use html2canvas to capture the current page
      const canvas = await html2canvas(currentPageRef.current, {
        scale: window.devicePixelRatio * 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      // Convert to base64 image
      const imageData = canvas.toDataURL('image/png');
      
      // Send to parent component
      if (onCaptureSnapshot) {
        onCaptureSnapshot(imageData);
      }

      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }

      toast({
        title: "Snapshot Created",
        description: "Image has been sent to the chat panel.",
      });
    } catch (error) {
      console.error("Error capturing snapshot:", error);
      toast({
        title: "Snapshot Failed",
        description: "Failed to capture the page. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      
      // Get position for the popover
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (pdfContainerRef.current) {
        const containerRect = pdfContainerRef.current.getBoundingClientRect();
        setPopoverPosition({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.bottom - containerRect.top
        });
      }
    } else {
      setSelectedText("");
      setPopoverPosition(null);
    }
  };

  // Handle explain button click
  const handleExplain = () => {
    if (selectedText) {
      // If onExplainText is provided, pass the selected text to parent
      if (onExplainText) {
        onExplainText(selectedText);
      }
      
      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }
      
      // Clear selection after sending
      setSelectedText("");
      setPopoverPosition(null);
    }
  };

  // Create array of page numbers for rendering
  const pageNumbers = Array.from(
    new Array(numPages),
    (_, index) => index + 1
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Zoom out"
                  disabled={selectionMode}
                >
                  <Minus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Zoom in"
                  disabled={selectionMode}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={captureFullPage}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Take full page snapshot"
                  disabled={isCapturing || selectionMode}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Take full page snapshot</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={startAreaSelection}
                  className={`p-1 rounded hover:bg-muted ${selectionMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  aria-label="Select area to capture"
                  disabled={isCapturing || selectionMode}
                >
                  <Lasso className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Select area to capture</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="min-h-full p-4 flex flex-col items-center bg-muted/10" 
          ref={pdfContainerRef}
          onMouseUp={selectionMode ? undefined : handleTextSelection}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !pdfData ? (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
              <p>No PDF available</p>
              <p className="text-xs mt-2">Upload a PDF file to view it here</p>
            </div>
          ) : (
            <>
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => console.error("Error loading PDF:", error)}
                className="pdf-container relative"
                loading={
                  <div className="flex items-center justify-center h-20 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                {pageNumbers.map(pageNumber => (
                  <div 
                    key={`page_${pageNumber}`} 
                    className="mb-4 shadow-md relative"
                    ref={pageNumber === currentPage ? currentPageRef : null}
                    onLoad={() => {
                      if (pageNumber === 1) setCurrentPage(1);
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onRenderSuccess={() => {
                        const observer = new IntersectionObserver((entries) => {
                          entries.forEach(entry => {
                            if (entry.isIntersecting) {
                              setCurrentPage(pageNumber);
                            }
                          });
                        }, { threshold: 0.5 });
                        
                        const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
                        if (pageElement) observer.observe(pageElement);
                        
                        return () => {
                          if (pageElement) observer.unobserve(pageElement);
                        };
                      }}
                    />
                    
                    {/* Selection overlay for the current page */}
                    {selectionMode && pageNumber === currentPage && (
                      <div 
                        className="absolute inset-0 z-10"
                        ref={canvasContainerRef}
                      >
                        <canvas ref={canvasRef} className="absolute inset-0"></canvas>
                        <div className="absolute top-2 right-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={cancelAreaSelection}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Document>

              {/* Explain tooltip that appears when text is selected */}
              {selectedText && popoverPosition && !selectionMode && (
                <div 
                  className="absolute z-10 bg-background shadow-lg rounded-lg border p-2"
                  style={{ 
                    left: `${popoverPosition.x}px`, 
                    top: `${popoverPosition.y + 5}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1 text-xs"
                    onClick={handleExplain}
                  >
                    <HelpCircle className="h-3 w-3" />
                    Explain
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
