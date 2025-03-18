
import { useEffect, useRef, useState } from "react";
import * as PDFJS from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";

// Initialize PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
}

const PdfViewer = ({ className }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pdfDoc, setPdfDoc] = useState<PDFJS.PDFDocumentProxy | null>(null);

  // Function to render a specific page
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // Create a div for this page
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page mb-4 relative';
      pageDiv.style.width = `${viewport.width}px`;
      pageDiv.style.height = `${viewport.height}px`;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      pageDiv.appendChild(canvas);
      
      // Clear previous content
      if (pageNum === 1) {
        while (canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild);
        }
      }
      
      canvasRef.current.appendChild(pageDiv);
      
      // Render PDF page
      const renderContext = {
        canvasContext: context!,
        viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error("Error rendering PDF page:", error);
    }
  };

  // Function to load a PDF from sessionStorage
  const loadPDF = async () => {
    setIsLoading(true);
    
    try {
      // Get PDF data from sessionStorage
      const pdfData = sessionStorage.getItem('pdfData');
      
      if (!pdfData) {
        console.error("No PDF data found in sessionStorage");
        setIsLoading(false);
        return;
      }
      
      // Load the PDF
      const loadingTask = PDFJS.getDocument({ data: atob(pdfData) });
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setIsLoading(false);
      
      // Render first page and following pages
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        await renderPage(i);
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPDF();
    
    return () => {
      // Cleanup
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, []);

  // Handle zoom in/out
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3.0);
    setScale(newScale);
    reloadAllPages();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    reloadAllPages();
  };

  const reloadAllPages = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    
    // Clear the container
    while (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }
    
    // Render first few pages
    for (let i = 1; i <= Math.min(pdfDoc.numPages, 3); i++) {
      await renderPage(i);
    }
  };

  // Effect to re-render when scale changes
  useEffect(() => {
    if (scale > 0 && pdfDoc) {
      reloadAllPages();
    }
  }, [scale]);

  // Load more pages when scrolling
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const totalHeight = container.scrollHeight;
    
    // If we're near the bottom and haven't rendered all pages
    if (scrollPosition > totalHeight * 0.8) {
      const renderedPages = canvasRef.current.childElementCount;
      
      if (renderedPages < numPages) {
        // Render the next page
        await renderPage(renderedPages + 1);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          
          <button 
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
        <div className="min-h-full p-4 flex justify-center bg-muted/10">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !pdfDoc ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No PDF available</p>
              <p className="text-xs mt-2">Upload a PDF file to view it here</p>
            </div>
          ) : (
            <div ref={canvasRef} className="pdf-container"></div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
