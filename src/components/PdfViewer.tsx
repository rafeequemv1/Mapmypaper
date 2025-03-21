
import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
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

  // Handle window resize and adjust container width
  useEffect(() => {
    const updateContainerWidth = () => {
      if (pdfContainerRef.current) {
        setContainerWidth(pdfContainerRef.current.clientWidth);
      }
    };

    // Initial measurement
    updateContainerWidth();
    
    // Listen for resize events
    window.addEventListener('resize', updateContainerWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Handle successful document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
    
    // Update container width measurement after document loads
    if (pdfContainerRef.current) {
      setContainerWidth(pdfContainerRef.current.clientWidth);
    }
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Auto-fit PDF to container width
  const handleScaleToFit = () => {
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
      handleScaleToFit();
    }
  }, [containerWidth, numPages]);

  // Text selection handler - Fixed with improved positioning
  const handleTextSelection = () => {
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="min-h-full p-4 flex flex-col items-center bg-muted/10 relative" 
          ref={pdfContainerRef}
          onMouseUp={handleTextSelection}
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
                className="pdf-container w-full"
                loading={
                  <div className="flex items-center justify-center h-20 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                {pageNumbers.map(pageNumber => (
                  <div 
                    key={`page_${pageNumber}`} 
                    className="mb-4 shadow-md relative max-w-full"
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
                      className="max-w-full"
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

              {/* Explain tooltip that appears when text is selected - Moved outside the Document component */}
              {selectedText && popoverPosition && (
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

