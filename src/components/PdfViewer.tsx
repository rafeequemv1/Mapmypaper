
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Minus, Plus, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

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
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

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

  // Keyboard shortcuts list
  const shortcuts = [
    { key: 'Enter', action: 'Insert sibling node' },
    { key: 'Shift + Enter', action: 'Insert sibling node before' },
    { key: 'Tab', action: 'Insert child node' },
    { key: 'Ctrl + Enter', action: 'Insert parent node' },
    { key: 'F1', action: 'Center mind map' },
    { key: 'F2', action: 'Edit current node' },
    { key: '↑', action: 'Select previous node' },
    { key: '↓', action: 'Select next node' },
    { key: '← / →', action: 'Select nodes on the left/right' },
    { key: 'PageUp / Alt + ↑', action: 'Move up' },
    { key: 'PageDown / Alt + ↓', action: 'Move down' },
    { key: 'Ctrl + ↑', action: 'Use two-sided layout' },
    { key: 'Ctrl + ←', action: 'Use left-sided layout' },
    { key: 'Ctrl + →', action: 'Use right-sided layout' },
    { key: 'Delete', action: 'Remove node' },
    { key: 'Ctrl + C', action: 'Copy' },
    { key: 'Ctrl + V', action: 'Paste' },
    { key: 'Ctrl + Z', action: 'Undo' },
    { key: 'Ctrl + Y', action: 'Redo' },
    { key: 'Ctrl + +', action: 'Zoom in mind map' },
    { key: 'Ctrl + -', action: 'Zoom out mind map' },
    { key: 'Ctrl + 0', action: 'Reset size' },
  ];

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
          
          <TooltipProvider>
            <Tooltip open={showShortcuts} onOpenChange={setShowShortcuts}>
              <TooltipTrigger asChild>
                <button 
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-2 bg-white shadow-md rounded-md w-64 max-h-80 overflow-y-auto">
                <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
                <ul className="space-y-1 text-xs">
                  {shortcuts.map((shortcut, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">{shortcut.key}</span>
                      <span className="text-gray-600">{shortcut.action}</span>
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
        
        {onTogglePdf && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onTogglePdf} 
            className="ml-2"
            aria-label={showPdf ? "Hide PDF" : "Show PDF"}
          >
            {showPdf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
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
