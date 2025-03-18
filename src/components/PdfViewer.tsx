import { useEffect, useRef, useState } from "react";
import * as PDFJS from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Minus, Plus, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Initialize PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
  onTogglePdf?: () => void;
  showPdf?: boolean;
}

const PdfViewer = ({ className, onTogglePdf, showPdf = true }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pdfDoc, setPdfDoc] = useState<PDFJS.PDFDocumentProxy | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

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
      
      // Update current page
      setCurrentPage(pageNum);
    } catch (error) {
      console.error("Error rendering PDF page:", error);
    }
  };

  // Function to load a PDF from sessionStorage
  const loadPDF = async () => {
    setIsLoading(true);
    
    try {
      // Get PDF data from sessionStorage - try both possible keys
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      
      if (!pdfData) {
        console.error("No PDF data found in sessionStorage");
        setIsLoading(false);
        return;
      }
      
      console.log("Loading PDF with data length:", pdfData.length);
      
      // Check if it's a base64 data URL
      let pdfBytes;
      if (pdfData.startsWith('data:application/pdf;base64,')) {
        pdfBytes = atob(pdfData.split(',')[1]);
      } else {
        pdfBytes = atob(pdfData);
      }
      
      // Load the PDF
      const loadingTask = PDFJS.getDocument({ data: pdfBytes });
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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          
          <button 
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          
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
