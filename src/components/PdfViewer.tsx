
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useNavigate } from "react-router-dom";

// Initialize the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
  onTogglePdf?: () => void;
  showPdf?: boolean;
}

const PdfViewer = ({ className, onTogglePdf, showPdf = true }: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const navigate = useNavigate();

  // Load PDF data from sessionStorage with retry logic
  useEffect(() => {
    const loadPdf = () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Try to get PDF data from either storage key
        const storedPdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
        
        if (!storedPdfData || storedPdfData.length < 100) {
          console.error("No valid PDF data found in sessionStorage");
          setLoadError("No PDF data found or data is invalid");
          setIsLoading(false);
          return;
        }
        
        // Validate that it's a base64 PDF
        if (!storedPdfData.startsWith('data:application/pdf;base64,')) {
          // Check if it's another valid data URL
          if (storedPdfData.startsWith('data:')) {
            console.error("Found data URL but not a PDF");
            setLoadError("The stored data is not a valid PDF");
          } else {
            console.error("Invalid data format for PDF");
            setLoadError("The stored data format is invalid");
          }
          setIsLoading(false);
          return;
        }
        
        console.log("PDF data loaded, length:", storedPdfData.length);
        setPdfData(storedPdfData);
      } catch (error) {
        console.error("Error loading PDF data:", error);
        setLoadError("Error loading PDF data from storage");
        setIsLoading(false);
        
        // Increment load attempts for retry logic
        setLoadAttempts(prev => prev + 1);
      }
    };

    loadPdf();
    
    // Set up a retry mechanism for loading the PDF data
    if (loadAttempts < 3 && !pdfData && loadError) {
      const retryTimer = setTimeout(() => {
        console.log(`Retrying PDF load, attempt ${loadAttempts + 1} of 3`);
        loadPdf();
      }, 2000); // Retry after 2 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [loadAttempts]);

  // Handle successful document load
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF document:", error);
    setLoadError(`Error loading PDF: ${error.message}`);
    setIsLoading(false);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // Handle navigation to upload page
  const handleUploadNew = () => {
    navigate("/");
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Zoom out"
                  disabled={!pdfData || isLoading}
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
                  disabled={!pdfData || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : pdfData && numPages > 0 ? `Page ${currentPage} of ${numPages}` : 'No PDF available'}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="min-h-full p-4 flex flex-col items-center bg-muted/10">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full w-full p-6">
              <Alert variant="destructive" className="mb-4 max-w-md">
                <FileText className="h-4 w-4" />
                <AlertTitle>PDF Error</AlertTitle>
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
              <Button onClick={handleUploadNew} className="mt-4">
                Upload New PDF
              </Button>
            </div>
          ) : !pdfData ? (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
              <p>No PDF available</p>
              <p className="text-xs mt-2">Upload a PDF file to view it here</p>
              <Button onClick={handleUploadNew} className="mt-4">
                Upload PDF
              </Button>
            </div>
          ) : (
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
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
                  className="mb-4 shadow-md"
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
                </div>
              ))}
            </Document>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
