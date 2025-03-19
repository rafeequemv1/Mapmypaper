
import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [selectionPosition, setSelectionPosition] = useState<{ x: number, y: number } | null>(null);
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
            
            // Calculate position for the tooltip
            const x = rect.left + rect.width / 2 - pdfRect.left;
            const y = rect.bottom - pdfRect.top;
            
            setSelectionPosition({ x, y });
            setSelectedText(text);
          }
        }
        
        if (!isWithinPdf) {
          setSelectionPosition(null);
          setSelectedText("");
        }
      } else {
        // No text selected
        setSelectionPosition(null);
        setSelectedText("");
      }
    };
    
    document.addEventListener('mouseup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  // Handle clicking outside to dismiss the selection tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        selectionPosition
      ) {
        setSelectionPosition(null);
        setSelectedText("");
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectionPosition]);

  // Handle explanation request
  const handleExplain = () => {
    if (selectedText && onExplainText) {
      onExplainText(selectedText);
      
      toast({
        title: "Explanation requested",
        description: "Asking for explanation about the selected text.",
      });
      
      // Hide the selection tooltip after request
      setSelectionPosition(null);
      setSelectedText("");
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
          )}
          
          {/* Selection Tooltip */}
          {selectionPosition && selectedText && (
            <div 
              className="absolute z-50 bg-white shadow-lg rounded-md border border-gray-200"
              style={{ 
                left: `${selectionPosition.x}px`, 
                top: `${selectionPosition.y + 10}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 p-2"
                onClick={handleExplain}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Explain</span>
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
