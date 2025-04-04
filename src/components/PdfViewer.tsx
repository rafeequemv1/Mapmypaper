import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import html2canvas from 'html2canvas';

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onAreaSelected?: (imageDataUrl: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

// Define selection point interface for better type safety
interface SelectionPoint {
  x: number;
  y: number;
}

// Define selection rectangle interface for better type safety
interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onAreaSelected, onPdfLoaded, renderTooltipContent }, ref) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
    const { toast } = useToast();
    const activeHighlightRef = useRef<HTMLElement | null>(null);
    const [scale, setScale] = useState<number>(1);
    const [isAreaSelectionMode, setIsAreaSelectionMode] = useState<boolean>(false);
    const [selectionStart, setSelectionStart] = useState<SelectionPoint | null>(null);
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
    const selectionOverlayRef = useRef<HTMLDivElement | null>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);

    useEffect(() => {
      try {
        // Try to get PDF data from either key
        const storedData =
          sessionStorage.getItem("pdfData") || 
          sessionStorage.getItem("uploadedPdfData");
        
        if (storedData) {
          setPdfData(storedData);
        } else {
          toast({
            title: "No PDF Found",
            description: "Please upload a PDF document first.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error retrieving PDF data:", error);
        toast({
          title: "Error loading PDF",
          description: "Could not load the PDF document.",
          variant: "destructive",
        });
      }
    }, [toast]);

    // Improved area selection capture with better error handling and debugging
    const captureSelectedArea = () => {
      if (!selectionRect || !pdfContainerRef.current) {
        console.error("Cannot capture: missing selection rectangle or container reference");
        toast({
          title: "Capture failed",
          description: "Invalid selection area. Please try drawing the rectangle again.",
          variant: "destructive",
        });
        return;
      }
      
      const viewportElement = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewportElement) {
        console.error("Cannot capture: viewport element not found");
        toast({
          title: "Capture failed",
          description: "PDF viewer element not found. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Show a capturing toast
      toast({
        title: "Capturing area...",
        description: "Please wait while we process the selection.",
      });
      
      console.log("Starting area capture process with html2canvas", {
        selection: selectionRect,
        viewportElement: viewportElement
      });
      
      // Use requestAnimationFrame for better rendering timing
      requestAnimationFrame(() => {
        performCapture(viewportElement as HTMLElement, selectionRect);
      });
    };

    const performCapture = async (element: HTMLElement, rect: SelectionRect) => {
      try {
        console.log("Starting html2canvas with scale:", window.devicePixelRatio || 2);
        
        const canvas = await html2canvas(element, {
          scale: window.devicePixelRatio || 2,
          logging: true,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          imageTimeout: 15000, // Extend timeout for large PDFs
        });
        
        console.log("Canvas capture complete", {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          selectionRect: rect
        });
        
        // Get canvas context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }
        
        // Ensure selection rectangle values are valid
        if (rect.width <= 0 || rect.height <= 0) {
          throw new Error("Invalid selection dimensions");
        }
        
        // Use device pixel ratio for accurate scaling
        const ratio = window.devicePixelRatio || 1;
        
        // Calculate selection coordinates adjusted for device pixel ratio
        const sx = Math.round(rect.x * ratio);
        const sy = Math.round(rect.y * ratio);
        const sw = Math.round(rect.width * ratio);
        const sh = Math.round(rect.height * ratio);
        
        console.log("Cropping with pixel ratio adjustment", {
          ratio,
          adjusted: { sx, sy, sw, sh },
          original: rect
        });
        
        // Create a new canvas for just the selection
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = sw;
        croppedCanvas.height = sh;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        if (!croppedCtx) {
          throw new Error("Failed to get cropped canvas context");
        }
        
        // Draw only the selected area to the new canvas
        croppedCtx.drawImage(
          canvas, 
          sx, 
          sy, 
          sw, 
          sh,
          0, 
          0, 
          sw, 
          sh
        );
        
        // Convert to data URL - force JPEG for smaller size to avoid storage quota issues
        const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.85);
        console.log("Data URL generated successfully", {
          length: dataUrl.length,
          preview: dataUrl.substring(0, 50) + "...",
          type: dataUrl.split(';')[0]
        });
        
        if (dataUrl.length < 100) {
          throw new Error("Generated image is too small or empty");
        }
        
        // Send to parent component
        if (onAreaSelected) {
          console.log("Calling onAreaSelected callback with image data length:", dataUrl.length);
          onAreaSelected(dataUrl);
          
          // Clear selection and exit selection mode
          setSelectionRect(null);
          setSelectionStart(null);
          setIsAreaSelectionMode(false);
          setIsDrawing(false);
          
          toast({
            title: "Area captured",
            description: "The selected area has been captured and sent for explanation.",
          });
        } else {
          console.error("onAreaSelected callback not provided");
          throw new Error("Cannot process image: callback not found");
        }
      } catch (err) {
        console.error("Error in capture process:", err);
        toast({
          title: "Capture failed",
          description: "Failed to capture the selected area: " + (err as Error).message,
          variant: "destructive",
        });
      }
    };

    // Handle text selection - modified to respect area selection mode
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isAreaSelectionMode) return; // Skip if we're in area selection mode
      
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "" && onTextSelected) {
        const text = selection.toString().trim();
        
        // If text is selected and has minimum length, call the callback without showing tooltip
        if (text.length > 2) {
          onTextSelected(text);
        }
      }
    };

    // Area selection handlers - improved for better UX
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode) return;
      
      // Prevent default to avoid text selection
      e.preventDefault();
      
      setIsDrawing(true);
      
      // Get viewport element and its scroll position
      const viewportElement = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewportElement) return;
      
      const containerRect = viewportElement.getBoundingClientRect();
      const scrollTop = viewportElement.scrollTop;
      
      // Calculate position relative to viewport accounting for scroll
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top + scrollTop;
      
      console.log("Selection started at", { x, y, scrollTop });
      
      setSelectionStart({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
      
      // Add no-select class to body to prevent text selection
      document.body.classList.add('no-select');
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode || !selectionStart || !isDrawing) return;
      
      // Get viewport element
      const viewportElement = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewportElement) return;
      
      const containerRect = viewportElement.getBoundingClientRect();
      const scrollTop = viewportElement.scrollTop;
      
      // Calculate position relative to viewport accounting for scroll
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top + scrollTop;
      
      setSelectionRect({
        x: Math.min(selectionStart.x, currentX),
        y: Math.min(selectionStart.y, currentY),
        width: Math.abs(currentX - selectionStart.x),
        height: Math.abs(currentY - selectionStart.y)
      });
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode) return;
      
      setIsDrawing(false);
      
      // Remove no-select class from body
      document.body.classList.remove('no-select');
      
      // Keep selection rectangle visible if it has meaningful dimensions
      if (!selectionRect || selectionRect.width < 5 || selectionRect.height < 5) {
        setSelectionRect(null);
      }
    };

    const cancelAreaSelection = () => {
      setSelectionRect(null);
      setSelectionStart(null);
      setIsAreaSelectionMode(false);
      setIsDrawing(false);
      
      // Remove no-select class from body
      document.body.classList.remove('no-select');
    };

    // Toggle area selection mode
    const toggleAreaSelectionMode = () => {
      if (isAreaSelectionMode) {
        cancelAreaSelection();
      } else {
        setIsAreaSelectionMode(true);
        toast({
          title: "Area selection mode",
          description: "Click and drag to select an area of the PDF.",
        });
      }
    };

    const handleSearch = () => {
      if (!searchQuery.trim()) return;
      
      // Get all text content from PDF pages
      const results: string[] = [];
      const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
      
      // Reset previous highlights
      document.querySelectorAll('.pdf-search-highlight').forEach(el => {
        (el as HTMLElement).style.backgroundColor = '';
        el.classList.remove('pdf-search-highlight');
      });
      
      // Reset active highlight if any
      if (activeHighlightRef.current) {
        activeHighlightRef.current.classList.remove('pdf-search-highlight-active');
        activeHighlightRef.current = null;
      }
      
      textLayers.forEach((layer, pageIndex) => {
        const textContent = layer.textContent || '';
        const regex = new RegExp(searchQuery, 'gi');
        let match;
        let hasMatch = false;
        
        // Find matches and create an array of page numbers
        while ((match = regex.exec(textContent)) !== null) {
          results.push(`page${pageIndex + 1}`);
          hasMatch = true;
        }
        
        // Only proceed with highlighting if there was a match on this page
        if (hasMatch) {
          // Highlight text in the PDF with more visible yellow background
          if (layer.childNodes) {
            layer.childNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE && node.parentElement && node.textContent) {
                const parent = node.parentElement;
                
                // Apply highlight to matching text
                const nodeText = parent.textContent || '';
                const lowerNodeText = nodeText.toLowerCase();
                const lowerSearchQuery = searchQuery.toLowerCase();
                
                if (lowerNodeText.includes(lowerSearchQuery)) {
                  parent.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                  parent.classList.add('pdf-search-highlight');
                  
                  // Apply pulsing animation to make highlighting more noticeable
                  parent.style.transition = 'background-color 0.5s ease-in-out';
                }
              }
            });
          }
        }
      });
      
      // Remove duplicates
      const uniqueResults = [...new Set(results)];
      setSearchResults(uniqueResults);
      
      // Style for the highlights
      const style = document.createElement('style');
      style.innerHTML = `
        .pdf-search-highlight {
          background-color: rgba(255, 255, 0, 0.5) !important;
          border-radius: 2px;
          padding: 0 1px;
        }
        .pdf-search-highlight-active {
          background-color: rgba(255, 165, 0, 0.7) !important;
          box-shadow: 0 0 2px 2px rgba(255, 165, 0, 0.4);
        }
      `;
      document.head.appendChild(style);
      
      if (uniqueResults.length > 0) {
        setCurrentSearchIndex(0);
        scrollToPosition(uniqueResults[0]);
        toast({
          title: "Search Results",
          description: `Found ${uniqueResults.length} occurrences of "${searchQuery}"`,
        });
      } else {
        toast({
          title: "No results found",
          description: `Could not find "${searchQuery}" in the document.`,
        });
      }
    };

    const navigateSearch = (direction: 'next' | 'prev') => {
      if (searchResults.length === 0) return;
      
      // Remove active highlight from current result
      if (activeHighlightRef.current) {
        activeHighlightRef.current.classList.remove('pdf-search-highlight-active');
      }
      
      let newIndex = currentSearchIndex;
      
      if (direction === 'next') {
        newIndex = (currentSearchIndex + 1) % searchResults.length;
      } else {
        newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
      }
      
      setCurrentSearchIndex(newIndex);
      scrollToPosition(searchResults[newIndex]);
    };

    // Helper function to scroll to position
    const scrollToPosition = (position: string) => {
      if (position.toLowerCase().startsWith('page')) {
        const pageNumber = parseInt(position.replace(/[^\d]/g, ''), 10);
        if (!isNaN(pageNumber) && pageNumber > 0) {
          scrollToPage(pageNumber);
        }
      }
    };

    // Handle document loaded
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      // Initialize the array with the correct number of null elements
      pagesRef.current = Array(numPages).fill(null);
      if (onPdfLoaded) {
        onPdfLoaded();
      }
    };

    // Handle page render success to adjust container height
    const onPageRenderSuccess = (page: any) => {
      setPageHeight(page.height);
    };

    // Set page ref - use a stable callback that doesn't cause re-renders
    const setPageRef = (index: number) => (element: HTMLDivElement | null) => {
      if (pagesRef.current && index >= 0 && index < pagesRef.current.length) {
        pagesRef.current[index] = element;
      }
    };

    // Zoom handlers
    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setScale(1);

    // Calculate optimal width for PDF pages
    const getOptimalPageWidth = () => {
      if (!pdfContainerRef.current) return undefined;
      
      const containerWidth = pdfContainerRef.current.clientWidth;
      // Use the full container width
      return containerWidth - 16; // Just a small margin for aesthetics
    };

    // Enhanced scroll to page functionality with highlighting
    const scrollToPage = (pageNumber: number) => {
      if (pageNumber < 1 || pageNumber > numPages) {
        console.warn(`Invalid page number: ${pageNumber}. Pages range from 1 to ${numPages}`);
        return;
      }
      
      console.log(`Scrolling to page: ${pageNumber}`);
      
      const pageIndex = pageNumber - 1; // Convert to 0-based index
      const targetPage = pagesRef.current[pageIndex];
      
      if (targetPage && pdfContainerRef.current) {
        const scrollContainer = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          // Scroll the page into view with smooth animation
          targetPage.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Enhanced flash effect to highlight the page
          targetPage.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
          targetPage.style.transition = 'background-color 0.5s ease-in-out';
          setTimeout(() => {
            targetPage.style.backgroundColor = '';
          }, 1800);
          
          // If searching, find and highlight the active search result on this page
          if (searchQuery && searchResults.includes(`page${pageNumber}`)) {
            setTimeout(() => {
              const highlights = targetPage.querySelectorAll('.pdf-search-highlight');
              
              // Find the first highlight on the page and make it active
              if (highlights.length > 0) {
                // Remove active class from previous active highlight
                if (activeHighlightRef.current) {
                  activeHighlightRef.current.classList.remove('pdf-search-highlight-active');
                }
                
                // Set new active highlight
                const firstHighlight = highlights[0] as HTMLElement;
                firstHighlight.classList.add('pdf-search-highlight-active');
                activeHighlightRef.current = firstHighlight;
                
                // Make sure the highlight is visible in the viewport
                firstHighlight.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }, 500); // Give time for the page to be scrolled into view
          }
        }
      }
    };

    // Expose the scrollToPage method to parent components
    useImperativeHandle(ref, () => ({
      scrollToPage
    }), [numPages]);
    
    // Listen for custom events to scroll to specific pages (from citations)
    useEffect(() => {
      const handleScrollToPdfPage = (event: any) => {
        const { pageNumber } = event.detail;
        if (pageNumber && typeof pageNumber === 'number') {
          console.log("Custom event received to scroll to page:", pageNumber);
          scrollToPage(pageNumber);
        }
      };
      
      window.addEventListener('scrollToPdfPage', handleScrollToPdfPage);
      
      return () => {
        window.removeEventListener('scrollToPdfPage', handleScrollToPdfPage);
      };
    }, [numPages]);
    
    // Add global CSS for preventing text selection during area selection
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        .no-select {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.body.classList.remove('no-select');
      };
    }, []);

    return (
      <div className="h-full flex flex-col bg-gray-50" data-pdf-viewer>
        {/* PDF Toolbar */}
        <div className="bg-white border-b p-1 flex flex-wrap items-center gap-2 z-10">
          {/* Zoom Controls with percentage display */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-black" 
              onClick={zoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs w-12 text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-black" 
              onClick={zoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-black" 
              onClick={resetZoom}
              title="Reset Zoom"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAreaSelectionMode ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 text-black"
                  onClick={toggleAreaSelectionMode}
                  title={isAreaSelectionMode ? "Cancel Area Selection" : "Select Area"}
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAreaSelectionMode ? "Cancel area selection" : "Select area for explanation"}
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Search Input */}
          <div className="flex-1 mx-2">
            <div className="flex items-center">
              <Input
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 text-sm mr-2"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 flex items-center gap-1 text-black"
                onClick={handleSearch}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </Button>
            </div>
          </div>
          
          {/* Search Navigation */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-black"
                  onClick={() => navigateSearch('prev')}
                >
                  ←
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-black"
                  onClick={() => navigateSearch('next')}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Content with full width */}
        {pdfData ? (
          <ScrollArea className="flex-1" ref={pdfContainerRef}>
            <div 
              className={`flex flex-col items-center py-4 relative ${isAreaSelectionMode ? 'cursor-crosshair' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={(e) => {
                handleMouseUp(e);
                handleDocumentMouseUp(e);
              }}
            >
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                className="w-full"
                loading={<div className="text-center py-4">Loading PDF...</div>}
                error={<div className="text-center py-4 text-red-500">Failed to load PDF. Please try again.</div>}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="mb-8 shadow-lg bg-white border border-gray-300 transition-colors duration-300 mx-auto"
                    ref={setPageRef(index)}
                    style={{ width: 'fit-content', maxWidth: '100%' }}
                    data-page-number={index + 1}
                  >
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      onRenderSuccess={onPageRenderSuccess}
                      scale={scale}
                      width={getOptimalPageWidth()}
                      className="mx-auto"
                      loading={
                        <div className="flex items-center justify-center h-[600px] w-full">
                          <div className="animate-pulse bg-gray-200 h-full w-full"></div>
                        </div>
                      }
                    />
                    <div className="text-center text-xs text-gray-500 py-2 border-t border-gray-300">
                      Page {index + 1} of {numPages}
                    </div>
                  </div>
                ))}
              </Document>
              
              {/* Selection overlay with improved styling */}
              {selectionRect && (
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: `${selectionRect.x}px`,
                    top: `${selectionRect.y}px`,
                    width: `${selectionRect.width}px`,
                    height: `${selectionRect.height}px`,
                    border: '2px dashed #9b87f5', 
                    backgroundColor: 'rgba(155, 135, 245, 0.15)',
                    zIndex: 10,
                  }}
                  ref={selectionOverlayRef}
                />
              )}
              
              {/* Capture buttons - positioned outside the overlay with pointer-events enabled */}
              {selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && !isDrawing && (
                <div
                  className="absolute bg-white rounded-md shadow-md p-2 flex gap-2 pointer-events-auto"
                  style={{
                    left: `${selectionRect.x + selectionRect.width / 2}px`,
                    top: `${selectionRect.y + selectionRect.height + 8}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 11,
                  }}
                >
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={captureSelectedArea}
                    className="pointer-events-auto bg-purple-500 hover:bg-purple-600"
                  >
                    Explain
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={cancelAreaSelection}
                    className="pointer-events-auto"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">Loading PDF...</p>
          </div>
        )}
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
