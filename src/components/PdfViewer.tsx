import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut, Download, Search, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getPdfData, getCurrentPdf } from '@/utils/pdfStorage';
import { useToast } from '@/hooks/use-toast';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
}

const PdfViewer = forwardRef<any, PdfViewerProps>(({ onTextSelected, onImageCaptured }, ref) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureStart, setCaptureStart] = useState<{ x: number; y: number } | null>(null);
  const [captureEnd, setCaptureEnd] = useState<{ x: number; y: number } | null>(null);
  
  const documentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    scrollToPage: (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= (numPages || 1)) {
        setPageNumber(pageNum);
        const pageElement = document.querySelector(`[data-page-number="${pageNum}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }));

  // Load PDF data when component mounts
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const currentPdfKey = await getCurrentPdf();
        
        if (!currentPdfKey) {
          setIsLoading(false);
          return;
        }
        
        const data = await getPdfData(currentPdfKey);
        if (data) {
          setPdfData(data);
        } else {
          toast({
            title: "PDF Not Found",
            description: "The requested PDF could not be loaded.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          title: "Error",
          description: "Failed to load the PDF file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
    
    // Listen for PDF switch events
    const handlePdfSwitch = async (event: any) => {
      if (event.detail?.pdfKey) {
        try {
          setIsLoading(true);
          const data = await getPdfData(event.detail.pdfKey);
          if (data) {
            setPdfData(data);
            setPageNumber(1); // Reset to first page
          }
        } catch (error) {
          console.error("Error switching PDF:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    window.addEventListener('pdfSwitched', handlePdfSwitch);
    return () => {
      window.removeEventListener('pdfSwitched', handlePdfSwitch);
    };
  }, [toast]);

  // Handle document load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (onTextSelected) {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          onTextSelected(selection.toString());
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onTextSelected]);

  // Handle zoom in/out
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.6));

  // Handle download
  const handleDownload = () => {
    if (!pdfData) return;
    
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchText.trim() || !pdfData) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    
    try {
      // This is a simplified search implementation
      // In a real app, you'd use PDF.js's search functionality
      const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
      const results = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        
        if (text.toLowerCase().includes(searchText.toLowerCase())) {
          results.push({ pageNumber: i, text });
        }
      }
      
      setSearchResults(results);
      if (results.length > 0) {
        setCurrentSearchIndex(0);
        setPageNumber(results[0].pageNumber);
      } else {
        toast({
          title: "No results found",
          description: `No matches found for "${searchText}"`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching the document.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate through search results
  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    setPageNumber(searchResults[newIndex].pageNumber);
  };

  // Handle area capture
  const startCapture = () => {
    setIsCapturing(true);
    setCaptureStart(null);
    setCaptureEnd(null);
    toast({
      title: "Area Capture Mode",
      description: "Click and drag to select an area of the PDF to capture.",
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCapturing) return;
    
    const rect = documentRef.current?.getBoundingClientRect();
    if (rect) {
      setCaptureStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCapturing || !captureStart) return;
    
    const rect = documentRef.current?.getBoundingClientRect();
    if (rect) {
      setCaptureEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isCapturing || !captureStart) return;
    
    const rect = documentRef.current?.getBoundingClientRect();
    if (rect) {
      const end = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setCaptureEnd(end);
      
      // Create a canvas to capture the area
      setTimeout(() => {
        captureArea(captureStart, end);
        setIsCapturing(false);
      }, 100);
    }
  };

  const captureArea = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!documentRef.current || !onImageCaptured) return;
    
    try {
      // Create canvas for capturing
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Calculate dimensions
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      if (width < 10 || height < 10) {
        toast({
          title: "Area too small",
          description: "Please select a larger area to capture.",
        });
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Get the visible PDF page elements
      const pdfPages = documentRef.current.querySelectorAll('.react-pdf__Page');
      
      // Draw the selected area to canvas
      const startX = Math.min(start.x, end.x);
      const startY = Math.min(start.y, end.y);
      
      pdfPages.forEach((page) => {
        const pageRect = page.getBoundingClientRect();
        const docRect = documentRef.current!.getBoundingClientRect();
        
        // Calculate page position relative to document container
        const pageLeft = pageRect.left - docRect.left;
        const pageTop = pageRect.top - docRect.top;
        
        // Check if this page intersects with the selection
        if (
          pageLeft < end.x && 
          pageLeft + pageRect.width > start.x && 
          pageTop < end.y && 
          pageTop + pageRect.height > start.y
        ) {
          // Find the canvas within this page
          const pageCanvas = page.querySelector('canvas');
          if (pageCanvas) {
            // Calculate the intersection area
            const ix1 = Math.max(startX - pageLeft, 0);
            const iy1 = Math.max(startY - pageTop, 0);
            const ix2 = Math.min(startX + width - pageLeft, pageRect.width);
            const iy2 = Math.min(startY + height - pageTop, pageRect.height);
            
            if (ix2 > ix1 && iy2 > iy1) {
              // Draw the intersection to our capture canvas
              context.drawImage(
                pageCanvas,
                ix1, iy1, ix2 - ix1, iy2 - iy1,
                Math.max(0, pageLeft - startX), Math.max(0, pageTop - startY), ix2 - ix1, iy2 - iy1
              );
            }
          }
        }
      });
      
      // Convert canvas to data URL and pass to callback
      const imageData = canvas.toDataURL('image/png');
      onImageCaptured(imageData);
      
      toast({
        title: "Area Captured",
        description: "The selected area has been captured for analysis.",
      });
    } catch (error) {
      console.error("Error capturing area:", error);
      toast({
        title: "Capture Error",
        description: "Failed to capture the selected area.",
        variant: "destructive",
      });
    }
  };

  // Render selection overlay during capture
  const renderSelectionOverlay = () => {
    if (!isCapturing || !captureStart || !captureEnd) return null;
    
    const left = Math.min(captureStart.x, captureEnd.x);
    const top = Math.min(captureStart.y, captureEnd.y);
    const width = Math.abs(captureEnd.x - captureStart.x);
    const height = Math.abs(captureEnd.y - captureStart.y);
    
    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-white">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={isLoading}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={isLoading}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-sm">
            {pageNumber} / {numPages || '?'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 w-40 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchText && (
              <button
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchText('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={startCapture}
                disabled={isLoading || isCapturing}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Capture area for AI analysis</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading || !pdfData}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Search results navigation */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border-b">
          <span className="text-sm">
            Result {currentSearchIndex + 1} of {searchResults.length}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateSearch('prev')}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateSearch('next')}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* PDF Document */}
      <div 
        className="flex-1 overflow-auto relative"
        ref={documentRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading PDF...</span>
          </div>
        ) : pdfData ? (
          <Document
            file={{ data: pdfData }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("PDF load error:", error)}
            className="flex flex-col items-center py-4"
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <div key={`page_${index + 1}`} className="mb-4 shadow-md">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  canvasRef={index + 1 === pageNumber ? canvasRef : undefined}
                  className="border border-gray-200"
                  data-page-number={index + 1}
                />
              </div>
            ))}
          </Document>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No PDF loaded. Please select a document.</p>
          </div>
        )}
        
        {/* Selection overlay for area capture */}
        {renderSelectionOverlay()}
        
        {/* Capture mode indicator */}
        {isCapturing && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Capture Mode: Click and drag to select area
          </div>
        )}
      </div>
    </div>
  );
});

PdfViewer.displayName = 'PdfViewer';

export default PdfViewer;
