import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { chatWithGeminiAboutPdf } from "@/services/gemini";
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
}

const PdfViewer = ({ className, onTogglePdf, showPdf = true, onExplainText }: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
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

  // Monitor container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerWidth = () => {
      if (containerRef.current) {
        // Get the width of the container minus padding
        const newWidth = containerRef.current.clientWidth - 32; // 32px for padding
        setContainerWidth(newWidth);
      }
    };
    
    // Initial width calculation
    updateContainerWidth();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Handle text selection in the PDF
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      
      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim();
        
        // Check if selection is within our container
        let isWithinPdf = false;
        const pdfContainer = containerRef.current;
        
        if (pdfContainer && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const pdfRect = pdfContainer.getBoundingClientRect();
          
          // Check if selection is within PDF container
          if (
            rect.left >= pdfRect.left &&
            rect.right <= pdfRect.right &&
            rect.top >= pdfRect.top &&
            rect.bottom <= pdfRect.bottom
          ) {
            isWithinPdf = true;
            
            // Set selected text
            setSelectedText(text);
            
            // Position the tooltip near the selection
            setTooltipPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10
            });
            
            // Show tooltip
            setShowTooltip(true);
          }
        }
        
        if (!isWithinPdf) {
          setSelectedText("");
          setShowTooltip(false);
        }
      } else {
        // No text selected
        setSelectedText("");
        setShowTooltip(false);
      }
    };
    
    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  // Handle explaining selected text
  const handleExplainClick = () => {
    if (selectedText && onExplainText) {
      onExplainText(selectedText);
      
      toast({
        title: "Explaining selected text",
        description: "Processing your selection...",
      });
      
      // Clear selection after sending for explanation
      if (window.getSelection) {
        if (window.getSelection()?.empty) {
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {
          window.getSelection()?.removeAllRanges();
        }
      }
      
      // Hide tooltip
      setShowTooltip(false);
    }
  };

  // Handle successful document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Create array of page numbers for rendering
  const pageNumbers = Array.from(
    new Array(numPages),
    (_, index) => index + 1
  );

  return (
    <div className={`flex flex-col h-full ${className}`} ref={containerRef}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="min-h-full p-4 flex flex-col items-center bg-muted/10">
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
                    className="mb-4 shadow-md max-w-full"
                    style={{
                      width: containerWidth > 0 ? `${containerWidth}px` : 'auto'
                    }}
                    onLoad={() => {
                      if (pageNumber === 1) setCurrentPage(1);
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={containerWidth > 0 ? containerWidth : undefined}
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
              
              {/* Explain tooltip */}
              {showTooltip && selectedText && (
                <div 
                  className="fixed z-50"
                  style={{
                    left: `${tooltipPosition.x}px`,
                    top: `${tooltipPosition.y}px`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <TooltipProvider>
                    <Tooltip open={true}>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          className="rounded-full hover:bg-primary"
                          onClick={handleExplainClick}
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Explain
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Explain this text</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
