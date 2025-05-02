import React, { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Download,
  RotateCw,
  Selection,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import html2canvas from 'html2canvas';
import { useResizeDetector } from 'react-resize-detector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
  activePdfKey: string;
  onActivePdfKeyChange: (key: string) => void;
}

const PdfViewer = ({ 
  pdfUrl, 
  onTextSelected, 
  onImageCaptured,
  activePdfKey,
  onActivePdfKeyChange
}: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number | null;
    startY: number | null;
    width: number | null;
    height: number | null;
    left: number | null;
    top: number | null;
  }>({
    startX: null,
    startY: null,
    width: null,
    height: null,
    left: null,
    top: null,
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showAreaTooltip, setShowAreaTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionRectRef = useRef<{
    startX: number | null;
    startY: number | null;
    width: number | null;
    height: number | null;
    left: number | null;
    top: number | null;
  }>({
    startX: null,
    startY: null,
    width: null,
    height: null,
    left: null,
    top: null,
  });
  const activePdfPageRef = useRef<number | null>(null);
  const [selectionCanvas, setSelectionCanvas] = useState<HTMLCanvasElement | null>(null);
  const { toast } = useToast();
  const { width, height } = useResizeDetector({ refreshMode: 'debounce', refreshRate: 250 });
  
  // Load PDF document
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };
  
  // Change page
  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= numPages!) {
        return newPageNumber;
      } else {
        return prevPageNumber;
      }
    });
  };
  
  // Go to previous page
  const previousPage = () => changePage(-1);
  
  // Go to next page
  const nextPage = () => changePage(1);
  
  // Zoom in
  const zoomIn = () => {
    setScale((prevScale) => parseFloat((prevScale + 0.1).toFixed(1)));
  };
  
  // Zoom out
  const zoomOut = () => {
    setScale((prevScale) => {
      const newScale = parseFloat((prevScale - 0.1).toFixed(1));
      return newScale > 0.1 ? newScale : 0.1;
    });
  };
  
  // Rotate
  const rotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };
  
  // Handle text layer rendering
  const handleTextLayerRendered = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Start area selection
  const startAreaSelection = () => {
    setIsSelectionMode(true);
    setShowAreaTooltip(true);
  };
  
  // Initialize canvas for selection
  useEffect(() => {
    const canvas = selectionCanvasRef.current;
    if (canvas) {
      setSelectionCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);
  
  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectionMode || !selectionCanvas) return;
    
    const canvasRect = selectionCanvas.getBoundingClientRect();
    const startX = e.clientX - canvasRect.left;
    const startY = e.clientY - canvasRect.top;
    
    selectionRectRef.current = {
      startX,
      startY,
      width: 0,
      height: 0,
      left: startX,
      top: startY,
    };
    
    setSelectionRect({
      startX,
      startY,
      width: 0,
      height: 0,
      left: startX,
      top: startY,
    });
  };
  
  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectionMode || !selectionCanvas || !selectionRectRef.current) return;
    
    if (selectionRectRef.current.startX === null || selectionRectRef.current.startY === null) return;
    
    const canvasRect = selectionCanvas.getBoundingClientRect();
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;
    
    const width = currentX - selectionRectRef.current.startX;
    const height = currentY - selectionRectRef.current.startY;
    
    selectionRectRef.current = {
      ...selectionRectRef.current,
      width,
      height,
    };
    
    setSelectionRect({
      ...selectionRectRef.current,
      width,
      height,
    });
    
    drawSelection();
  };
  
  // Draw selection rectangle on canvas
  const drawSelection = () => {
    if (!selectionCanvas || !selectionRectRef.current) return;
    
    const canvas = selectionCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (selectionRectRef.current.startX !== null && selectionRectRef.current.startY !== null) {
      const { startX, startY, width, height } = selectionRectRef.current;
      
      if (startX !== null && startY !== null && width !== null && height !== null) {
        ctx.fillStyle = 'rgba(0, 119, 255, 0.3)';
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeStyle = '#0077ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, width, height);
      }
    }
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    if (!isSelectionMode) return;
    captureSelectedArea();
  };
  
  // Capture selected area
  const captureSelectedArea = () => {
    if (!selectionRectRef.current || !selectionCanvas) return;
    
    try {
      // Get the coordinates of the selection rectangle
      const rect = selectionRectRef.current;
      
      // Create a temporary canvas to crop the area
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get 2D context for canvas');
        return;
      }
      
      // Set the temp canvas dimensions to the selection dimensions
      tempCanvas.width = Math.abs(rect.width as number);
      tempCanvas.height = Math.abs(rect.height as number);
      
      // Find the PDF page that contains our selection
      const pdfPages = document.querySelectorAll('[data-page-number]');
      const pageNum = activePdfPageRef.current || 1;
      let targetPage: Element | null = null;
      
      for (let i = 0; i < pdfPages.length; i++) {
        if ((pdfPages[i] as HTMLElement).dataset.pageNumber === String(pageNum)) {
          targetPage = pdfPages[i];
          break;
        }
      }
      
      if (!targetPage) {
        console.error('Could not find target page element');
        return;
      }
      
      // Get all necessary measurements
      const pageRect = targetPage.getBoundingClientRect();
      const scrollContainer = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      const scrollTop = scrollContainer?.scrollTop || 0;
      const scrollLeft = scrollContainer?.scrollLeft || 0;
      const viewportRect = scrollContainer?.getBoundingClientRect() || { left: 0, top: 0 };
      
      // Use improved html2canvas options for better rendering
      html2canvas(targetPage as HTMLElement, {
        backgroundColor: null, // Transparent background
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: true, // Allow cross-origin images
        scrollX: -scrollLeft,
        scrollY: -scrollTop,
        // Add these additional options to improve rendering
        logging: true, // Enable logging for debugging
        onclone: (clonedDoc) => {
          // Fix styles in cloned document for better rendering
          const clonedPage = clonedDoc.querySelector(`[data-page-number="${pageNum}"]`);
          if (clonedPage) {
            // Ensure text is visible in captured image
            const textLayers = clonedPage.querySelectorAll('.react-pdf__Page__textContent');
            textLayers.forEach(layer => {
              if (layer instanceof HTMLElement) {
                layer.style.transform = 'none';
                layer.style.opacity = '1';
                layer.style.display = 'block';
              }
            });
          }
          return clonedDoc;
        }
      }).then(pageCanvas => {
        // Calculate the correct position on the page
        // We need to account for the page position, scroll position, and device pixel ratio
        const rectLeft = Math.min(rect.left!, rect.left! + rect.width!);
        const rectTop = Math.min(rect.top!, rect.top! + rect.height!);
        
        // Calculate exact position where to start copying from the source image
        // Need to account for the page's position relative to the viewport and scroll
        const sourceX = (rectLeft - (pageRect.left - viewportRect.left) + scrollLeft) * window.devicePixelRatio;
        const sourceY = (rectTop - (pageRect.top - viewportRect.top) + scrollTop) * window.devicePixelRatio;
        
        // Log debugging info
        console.log('Capture details:', {
          rectLeft, 
          rectTop,
          rectWidth: Math.abs(rect.width!),
          rectHeight: Math.abs(rect.height!),
          pageRectLeft: pageRect.left,
          pageRectTop: pageRect.top,
          viewportRectLeft: viewportRect.left,
          viewportRectTop: viewportRect.top,
          scrollTop,
          scrollLeft,
          sourceX,
          sourceY,
          devicePixelRatio: window.devicePixelRatio,
          pageCanvasWidth: pageCanvas.width,
          pageCanvasHeight: pageCanvas.height
        });
        
        // Draw only the selected portion to our temp canvas
        try {
          ctx.drawImage(
            pageCanvas,
            sourceX,
            sourceY,
            Math.abs(rect.width!) * window.devicePixelRatio,
            Math.abs(rect.height!) * window.devicePixelRatio,
            0,
            0,
            Math.abs(rect.width as number),
            Math.abs(rect.height as number)
          );
          
          // Check if the canvas is not empty/blank
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const pixelData = imageData.data;
          let hasData = false;
          
          // Check if the image has any non-transparent pixels
          for (let i = 0; i < pixelData.length; i += 4) {
            // If any pixel has color or alpha, the image is not blank
            if (pixelData[i] > 0 || pixelData[i+1] > 0 || pixelData[i+2] > 0 || pixelData[i+3] > 0) {
              hasData = true;
              break;
            }
          }
          
          if (!hasData) {
            console.warn('Generated image appears to be blank, trying alternative capture method');
            
            // Try alternative approach - capture with background
            // This helps when we're dealing with complex PDF content
            html2canvas(targetPage as HTMLElement, {
              backgroundColor: '#ffffff', // White background
              scale: window.devicePixelRatio || 1,
              useCORS: true,
              allowTaint: true,
              scrollX: -scrollLeft,
              scrollY: -scrollTop,
              ignoreElements: (element) => {
                // Ignore elements that might interfere
                return element.classList.contains('fabric-canvas-container');
              }
            }).then(alternateCanvas => {
              // Draw the selection from this new canvas
              ctx.fillStyle = '#ffffff'; // White background
              ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              ctx.drawImage(
                alternateCanvas,
                sourceX,
                sourceY,
                Math.abs(rect.width!) * window.devicePixelRatio,
                Math.abs(rect.height!) * window.devicePixelRatio,
                0,
                0,
                Math.abs(rect.width as number),
                Math.abs(rect.height as number)
              );
              
              finalizeImageCapture();
            }).catch(err => {
              console.error('Alternative capture method failed:', err);
              toast({
                title: "Capture failed",
                description: "Could not capture the selected area clearly.",
                variant: "destructive"
              });
            });
          } else {
            finalizeImageCapture();
          }
        } catch (drawError) {
          console.error('Error drawing the image section:', drawError);
          toast({
            title: "Capture Error",
            description: "Error processing the capture. Please try again.",
            variant: "destructive"
          });
        }
        
        // Helper function to finalize the image capture and send it
        function finalizeImageCapture() {
          // Convert to data URL
          const imageData = tempCanvas.toDataURL('image/png');
          
          // Verify image data is valid
          if (imageData === 'data:,') {
            console.error('Empty image data generated');
            toast({
              title: "Capture failed",
              description: "Generated image was empty. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          // Store the captured image
          setCapturedImage(imageData);
          
          // Send the captured image to parent component
          if (onImageCaptured) {
            onImageCaptured(imageData);
          }
          
          // Dispatch a custom event to open the chat with the image
          const event = new CustomEvent('openChatWithImage', {
            detail: { imageData }
          });
          window.dispatchEvent(event);
          
          // Hide tooltip and exit selection mode
          setShowAreaTooltip(false);
          setIsSelectionMode(false);
          
          toast({
            title: "Area captured",
            description: "The selected area has been sent to the chat.",
          });
        }
      }).catch(err => {
        console.error('Error capturing PDF area:', err);
        toast({
          title: "Capture failed",
          description: "Failed to capture the selected area. Please try again.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error('Error capturing selected area:', error);
      toast({
        title: "Capture failed",
        description: "An error occurred while capturing the selected area.",
        variant: "destructive"
      });
    }
  };
  
  // Handle text selection
  const handleTextSelection = () => {
    if (!onTextSelected) return;
    
    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString();
      if (selectedText) {
        onTextSelected(selectedText);
        
        // Dispatch a custom event to open the chat with the selected text
        const event = new CustomEvent('openChatWithText', {
          detail: { text: selectedText }
        });
        window.dispatchEvent(event);
      }
    }
  };
  
  // Handle page change
  useEffect(() => {
    // Notify parent component about the PDF switch
    const pdfKey = activePdfKey;
    if (onActivePdfKeyChange && pdfKey) {
      onActivePdfKeyChange(pdfKey);
    }
    
    // Reset page number when PDF changes
    setPageNumber(1);
  }, [pdfUrl, onActivePdfKeyChange, activePdfKey]);
  
  // Update active page ref
  useEffect(() => {
    activePdfPageRef.current = pageNumber;
  }, [pageNumber]);
  
  return (
    <div className="flex flex-col h-full">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousPage} disabled={pageNumber <= 1 || isLoading}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextPage} disabled={pageNumber >= numPages! || isLoading}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomIn} disabled={isLoading}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Zoom In
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomOut} disabled={isLoading}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Zoom Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={rotate} disabled={isLoading}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Rotate
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={startAreaSelection} disabled={isLoading}>
                  <Selection className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Capture Area
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild disabled={isLoading}>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                Download PDF
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div
            className="flex flex-col items-center justify-center"
            ref={pdfContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ width: '100%', minHeight: 'calc(100% + 1px)' }}
          >
            {isLoading && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading PDF...
                </div>
              </div>
            )}
            
            <div style={{ position: 'relative' }}>
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading=""
                className="w-full"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className="w-full"
                  onRenderSuccess={handleTextLayerRendered}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  onTextSelection={handleTextSelection}
                  data-page-number={pageNumber}
                />
              </Document>
              
              {/* Selection Canvas */}
              <canvas
                ref={selectionCanvasRef}
                width={width}
                height={height}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 100,
                  cursor: isSelectionMode ? 'crosshair' : 'default',
                }}
              />
              
              {/* Area Selection Tooltip */}
              {showAreaTooltip && isSelectionMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: selectionRect.startY || 0,
                    left: selectionRect.startX || 0,
                    backgroundColor: 'rgba(0, 119, 255, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 101,
                    pointerEvents: 'none',
                  }}
                >
                  Select area...
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PdfViewer;
