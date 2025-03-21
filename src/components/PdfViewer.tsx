import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
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
}

const PdfViewer = ({ 
  className, 
  onTogglePdf, 
  showPdf = true, 
  onExplainText,
  onRequestOpenChat
}: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>("");
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

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

  // Enhanced resize observer for more responsive container width updates
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    
    const updateContainerWidth = () => {
      if (pdfContainerRef.current) {
        const newWidth = pdfContainerRef.current.clientWidth;
        console.log("Container width updated:", newWidth);
        setContainerWidth(newWidth);
      }
    };
    
    // Create a ResizeObserver for more accurate width tracking
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    
    // Observe the container element
    resizeObserver.observe(pdfContainerRef.current);
    
    // Initial measurement
    updateContainerWidth();
    
    // Also listen for window resize events as a fallback
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      if (pdfContainerRef.current) {
        resizeObserver.unobserve(pdfContainerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  // Handle successful document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
    
    // Trigger container width measurement after document loads
    setTimeout(() => {
      if (pdfContainerRef.current) {
        const newWidth = pdfContainerRef.current.clientWidth;
        console.log("Container width after document load:", newWidth);
        setContainerWidth(newWidth);
      }
    }, 100);
  };

  // Improved auto-fit PDF to container width with better centering
  const handleScaleToFit = () => {
    if (pdfContainerRef.current && containerWidth > 0) {
      // Add padding to ensure the PDF has some margin
      const padding = 40;
      const availableWidth = Math.max(containerWidth - padding, 200);
      
      // Default PDF width is 595.28 points (8.5" × 72dpi)
      const defaultPdfWidth = 595.28;
      const newScale = availableWidth / defaultPdfWidth;
      
      console.log("Setting scale to fit:", {
        containerWidth,
        availableWidth,
        newScale,
      });
      
      // Keep scale between 0.5 and 2.0 for readability
      setScale(Math.min(Math.max(newScale, 0.5), 2.0));
    }
  };

  // Auto-fit on first load and container width changes with debounce
  useEffect(() => {
    if (containerWidth > 0 && numPages > 0) {
      // Add a slight delay to ensure accurate measurements
      const timeoutId = setTimeout(() => {
        handleScaleToFit();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [containerWidth, numPages]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Auto-fit PDF to container width
  const handleScaleToFitOriginal = () => {
    if (pdfContainerRef.current && containerWidth > 0) {
      // Reduce by 40px to account for padding
      const availableWidth = containerWidth - 40;
      // Default PDF width is 595.28 points (8.5" × 72dpi)
      const defaultPdfWidth = 595.28;
      const newScale = availableWidth / defaultPdfWidth;
      setScale(newScale);
    }
  };

  // Auto-fit on first load and container width changes
  useEffect(() => {
    if (containerWidth > 0 && numPages > 0) {
      handleScaleToFitOriginal();
    }
  }, [containerWidth, numPages]);

  // Text selection handler - Fixed with improved positioning
  const handleTextSelection = () => {
    // Only process text selection when not in area selection mode
    if (isSelectionMode) return;
    
    const selection = window.getSelection();
    
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      
      // Log selection to help debug
      console.log("Text selected:", text);
      
      try {
        // Get position for the popover
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (pdfContainerRef.current) {
          const containerRect = pdfContainerRef.current.getBoundingClientRect();
          const x = rect.left + (rect.width / 2) - containerRect.left;
          const y = rect.bottom - containerRect.top;
          
          console.log("Popover position calculated:", { x, y });
          console.log("Selection rect:", rect);
          console.log("Container rect:", containerRect);
          
          setPopoverPosition({ x, y });
        } else {
          console.error("PDF container ref is null");
        }
      } catch (error) {
        console.error("Error calculating popover position:", error);
        // Fallback position near the middle of the container
        if (pdfContainerRef.current) {
          const containerRect = pdfContainerRef.current.getBoundingClientRect();
          setPopoverPosition({ 
            x: containerRect.width / 2, 
            y: containerRect.height / 2 
          });
        }
      }
    } else {
      // Only clear when clicking outside of the tooltip
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (!newSelection || !newSelection.toString().trim()) {
          setSelectedText("");
          setPopoverPosition(null);
        }
      }, 100);
    }
  };

  // Handle mouse events for area selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectionMode) return;
    
    // Clear any previous selection
    setSelectionBox(null);
    
    // Clear any text selection when in snip mode
    if (window.getSelection) {
      window.getSelection()?.empty();
    }
    
    if (pdfContainerRef.current) {
      const containerRect = pdfContainerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y }); // Initialize end to same as start
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelectionMode || !selectionStart) return;
    
    // Ensure text isn't selected during snip operation
    if (window.getSelection) {
      window.getSelection()?.empty();
    }
    
    if (pdfContainerRef.current) {
      const containerRect = pdfContainerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      setSelectionEnd({ x, y });
      
      // Calculate selection box
      const left = Math.min(selectionStart.x, x);
      const top = Math.min(selectionStart.y, y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);
      
      setSelectionBox({ left, top, width, height });
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelectionMode) {
      // If not in selection mode, process text selection
      handleTextSelection();
      return;
    }
    
    if (!selectionStart || !selectionEnd || !selectionBox || isCapturing) return;
    
    // Only process if selection has some size
    if (selectionBox.width > 10 && selectionBox.height > 10) {
      // Set capturing state immediately to prevent multiple captures
      setIsCapturing(true);
      
      // Capture immediately
      captureSelection();
    } else {
      // Clear selection if it's too small
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectionBox(null);
    }
  };
  
  // Capture the selected area using html2canvas
  const captureSelection = async () => {
    if (!selectionBox || !pdfContainerRef.current) {
      setIsCapturing(false);
      return;
    }
    
    try {
      // Capture the entire PDF container
      const canvas = await html2canvas(pdfContainerRef.current, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      
      // Create a new canvas for the cropped area
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Set dimensions for the cropped canvas
      croppedCanvas.width = selectionBox.width;
      croppedCanvas.height = selectionBox.height;
      
      // Draw only the selected portion to the new canvas
      ctx.drawImage(
        canvas, 
        selectionBox.left, 
        selectionBox.top, 
        selectionBox.width, 
        selectionBox.height,
        0, 
        0, 
        selectionBox.width, 
        selectionBox.height
      );
      
      // Convert the cropped canvas to a data URL
      const imageData = croppedCanvas.toDataURL('image/png');
      
      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }
      
      // Store the image in sessionStorage for the chat to access
      sessionStorage.setItem('selectedImageForChat', imageData);
      
      // Add text query to explain the image
      if (onExplainText) {
        onExplainText(`[IMAGE_SNIPPET] Please explain this part of the document I've snipped.`);
      }
      
      // Show success toast
      toast({
        title: "Area captured",
        description: "The selected area has been sent to the chat for explanation",
      });
      
    } catch (error) {
      console.error("Error capturing selection:", error);
      toast({
        title: "Capture failed",
        description: "Could not capture the selected area",
        variant: "destructive"
      });
    } finally {
      // Exit selection mode and reset
      setIsSelectionMode(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectionBox(null);
      setIsCapturing(false);
      
      // Clear any browser text selection
      if (window.getSelection) {
        window.getSelection()?.empty();
      }
      
      // Remove CSS class to re-enable text selection
      if (pdfContainerRef.current) {
        pdfContainerRef.current.classList.remove('disable-text-selection');
      }
    }
  };

  // Toggle selection mode on/off
  const toggleSelectionMode = () => {
    const newSelectionMode = !isSelectionMode;
    setIsSelectionMode(newSelectionMode);
    
    // Clear any selections when toggling
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionBox(null);
    setSelectedText("");
    setPopoverPosition(null);
    
    // Clear any browser text selection
    if (window.getSelection) {
      window.getSelection()?.empty();
    }
    
    // Add CSS class to PDF container to disable text selection when in snip mode
    if (pdfContainerRef.current) {
      if (newSelectionMode) {
        pdfContainerRef.current.classList.add('disable-text-selection');
      } else {
        pdfContainerRef.current.classList.remove('disable-text-selection');
      }
    }
    
    toast({
      title: newSelectionMode ? "Selection mode activated" : "Selection mode deactivated",
      description: newSelectionMode 
        ? "Click and drag to select an area of the PDF" 
        : "Returned to normal mode",
    });
  };

  // Handle explain button click
  const handleExplain = () => {
    if (selectedText) {
      console.log("Sending text to explain:", selectedText);
      
      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        console.log("Requesting to open chat panel");
        onRequestOpenChat();
      }
      
      // If onExplainText is provided, pass the selected text to parent
      if (onExplainText) {
        onExplainText(selectedText);
      }
      
      // Clear selection after sending
      setSelectedText("");
      setPopoverPosition(null);
      
      // Also clear the browser's selection
      if (window.getSelection) {
        if (window.getSelection()?.empty) {
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {
          window.getSelection()?.removeAllRanges();
        }
      }
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
                  onClick={handleScaleToFit}
                  className="p-1 rounded hover:bg-muted text-muted-foreground text-xs"
                  aria-label="Fit to width"
                >
                  Fit
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Fit to width</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={toggleSelectionMode}
                  className={`p-1 rounded text-xs flex items-center gap-1 ${isSelectionMode 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground'}`}
                  aria-label="Area selection mode"
                  disabled={isCapturing}
                >
                  <Scissors className="h-3 w-3" />
                  Snip
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Select area to explain</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className={`min-h-full p-4 flex flex-col items-center bg-muted/10 relative ${isSelectionMode ? 'disable-text-selection' : ''}`}
          ref={pdfContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
                className="pdf-container"
                loading={
                  <div className="flex items-center justify-center h-20 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                {pageNumbers.map(pageNumber => (
                  <div 
                    key={`page_${pageNumber}`} 
                    className="mb-4 shadow-md relative w-full flex justify-center"
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
                      className="pdf-page"
                      width={containerWidth > 40 ? containerWidth - 40 : undefined}
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
                  </div>
                ))}
              </Document>

              {/* Selection box overlay */}
              {isSelectionMode && selectionBox && (
                <div 
                  className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                  style={{
                    left: `${selectionBox.left}px`,
                    top: `${selectionBox.top}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`
                  }}
                />
              )}

              {/* Explain tooltip that appears when text is selected */}
              {selectedText && popoverPosition && !isSelectionMode && (
                <div 
                  className="absolute z-50 bg-background shadow-lg rounded-lg border p-2"
                  style={{ 
                    left: `${popoverPosition.x}px`, 
                    top: `${popoverPosition.y + 10}px`,
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
