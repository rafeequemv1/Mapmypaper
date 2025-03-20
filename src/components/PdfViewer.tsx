import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
  onTogglePdf?: () => void;
  showPdf?: boolean;
  onExplainText?: (text: string) => void;
}

const PdfViewer = ({ className, onTogglePdf, showPdf = true, onExplainText }: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Reference to the PDF container to measure its width
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<number | null>(null);

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

  // Update container width when window resizes
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    // Initial measurement
    updateContainerWidth();

    // Set up resize listener
    window.addEventListener('resize', updateContainerWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Handle text selection in the PDF
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
        
        // Calculate position for the tooltip
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position the tooltip above the selection
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      } else {
        // Clear selection state after a short delay to allow for clicks on tooltip
        if (selectionTimeoutRef.current) {
          window.clearTimeout(selectionTimeoutRef.current);
        }
        
        selectionTimeoutRef.current = window.setTimeout(() => {
          setSelectedText("");
          setTooltipPosition(null);
        }, 300);
      }
    };

    document.addEventListener("selectionchange", handleSelection);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      if (selectionTimeoutRef.current) {
        window.clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle explaining selected text
  const handleExplainText = useCallback(() => {
    if (selectedText && onExplainText) {
      onExplainText(selectedText);
      setSelectedText("");
      setTooltipPosition(null);
    }
  }, [selectedText, onExplainText]);

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

  // Create array of page numbers for rendering
  const pageNumbers = Array.from(
    new Array(numPages),
    (_, index) => index + 1
  );

  return (
    <div className={`flex flex-col h-full ${className}`} ref={containerRef}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TooltipProvider>
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
          
          <TooltipProvider>
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="min-h-full p-4 flex flex-col items-center bg-muted/10 relative">
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
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error("Error loading PDF:", error)}
              className="pdf-container max-w-full"
              loading={
                <div className="flex items-center justify-center h-20 w-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              {pageNumbers.map(pageNumber => {
                // Calculate fitting scale based on container width
                // Standard US Letter is 8.5 x 11 inches at 72 DPI = 612 x 792 points
                const standardPageWidth = 612;
                const padding = 32; // Account for container padding
                const fitScale = containerWidth ? 
                  Math.min((containerWidth - padding) / standardPageWidth, scale) : scale;
                
                return (
                  <div 
                    key={`page_${pageNumber}`} 
                    className="mb-4 shadow-md max-w-full"
                    onLoad={() => {
                      if (pageNumber === 1) setCurrentPage(1);
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={fitScale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={Math.min(containerWidth - padding, standardPageWidth * scale)}
                      className="max-w-full"
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
                );
              })}
            </Document>
          )}
          
          {/* Explanation tooltip that appears when text is selected */}
          {tooltipPosition && selectedText && (
            <div 
              className="absolute z-50"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <Button 
                size="sm" 
                className="flex items-center gap-1 shadow-lg"
                onClick={handleExplainText}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Explain
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
