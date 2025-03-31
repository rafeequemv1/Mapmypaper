
import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
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
  onExplainImage?: (imageBase64: string) => void;
}

const PdfViewer = ({ 
  className, 
  onTogglePdf, 
  showPdf = true, 
  onExplainText,
  onRequestOpenChat,
  onExplainImage
}: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>("");
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAreaSelecting, setIsAreaSelecting] = useState<boolean>(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
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

  // Text selection handler - Fixed with improved positioning
  const handleTextSelection = () => {
    if (isAreaSelecting) return; // Don't process text selection during area selection

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

  // Area selection handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !pdfContainerRef.current) return; // Only handle left mouse button

    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    
    setIsAreaSelecting(true);
    setSelectionStart({ x: startX, y: startY });
    setSelectionEnd({ x: startX, y: startY });
    setSelectionBox({
      left: startX,
      top: startY,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAreaSelecting || !selectionStart || !pdfContainerRef.current) return;

    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
    const currentY = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));
    
    setSelectionEnd({ x: currentX, y: currentY });
    
    // Calculate the box coordinates
    const left = Math.min(selectionStart.x, currentX);
    const top = Math.min(selectionStart.y, currentY);
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    
    setSelectionBox({ left, top, width, height });
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAreaSelecting || !selectionBox || !pdfContainerRef.current) return;

    // Only proceed if the selection box is large enough
    if (selectionBox.width > 10 && selectionBox.height > 10) {
      try {
        // Position tooltip at bottom right of selection
        setPopoverPosition({
          x: selectionBox.left + selectionBox.width,
          y: selectionBox.top + selectionBox.height
        });

        // Show screenshot tooltip
        // The actual screenshot will be captured in handleExplainArea
      } catch (error) {
        console.error("Error setting up area selection:", error);
      }
    } else {
      // Reset if the selection is too small
      setSelectionBox(null);
    }
    
    setIsAreaSelecting(false);
  };

  // Handle explain button click for text
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

  // Handle explain button click for area selection
  const handleExplainArea = async () => {
    if (!selectionBox || !pdfContainerRef.current || !onExplainImage) return;
    
    try {
      // Create a temporary container for the screenshot
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = `${selectionBox.width}px`;
      tempDiv.style.height = `${selectionBox.height}px`;
      tempDiv.style.overflow = 'hidden';
      document.body.appendChild(tempDiv);
      
      // Clone the PDF container for screenshot
      const pdfClone = pdfContainerRef.current.cloneNode(true) as HTMLDivElement;
      pdfClone.style.position = 'absolute';
      pdfClone.style.left = `-${selectionBox.left}px`;
      pdfClone.style.top = `-${selectionBox.top}px`;
      tempDiv.appendChild(pdfClone);
      
      // Take screenshot
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: null,
        logging: false,
        scale: 2 // Higher resolution
      });
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/png');
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      // Request to open chat panel if it's closed
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }
      
      // Pass the image to parent
      onExplainImage(imageData);
      
      // Clear the selection
      setSelectionBox(null);
      setPopoverPosition(null);
      
      toast({
        title: "Image captured",
        description: "Processing the selected area..."
      });
      
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to capture the selected area",
        variant: "destructive"
      });
      
      // Clear the selection
      setSelectionBox(null);
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="min-h-full p-4 flex flex-col items-center bg-muted/10 relative" 
          ref={pdfContainerRef}
          onMouseUp={handleMouseUp}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
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
                    onMouseUp={handleTextSelection}
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
                  </div>
                ))}
              </Document>

              {/* Area selection box */}
              {selectionBox && (
                <div 
                  ref={selectionBoxRef}
                  className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-10"
                  style={{
                    left: `${selectionBox.left}px`,
                    top: `${selectionBox.top}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`
                  }}
                />
              )}

              {/* Explain tooltip for text or area selection */}
              {popoverPosition && (selectedText || selectionBox) && (
                <div 
                  className="absolute z-50 bg-background shadow-lg rounded-lg border p-2"
                  style={{ 
                    left: `${popoverPosition.x}px`, 
                    top: `${popoverPosition.y + 10}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {selectedText ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 text-xs"
                      onClick={handleExplain}
                    >
                      <HelpCircle className="h-3 w-3" />
                      Explain
                    </Button>
                  ) : selectionBox && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 text-xs"
                      onClick={handleExplainArea}
                    >
                      <Camera className="h-3 w-3" />
                      Explain Image
                    </Button>
                  )}
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
