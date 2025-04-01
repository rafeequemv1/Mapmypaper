
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, Screenshot } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import html2canvas from "html2canvas";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
  onImageCaptured?: (imageData: string) => void;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, renderTooltipContent, onImageCaptured }, ref) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [scale, setScale] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
    const selectionBoxRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const activeHighlightRef = useRef<HTMLElement | null>(null);
    
    // Selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
    const [selectionBox, setSelectionBox] = useState({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      visible: false
    });

    // Extract PDF data from sessionStorage
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

    // Handle text selection with tooltip positioned closer to cursor
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelecting) {
        captureSelectedArea();
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "") {
        const text = selection.toString().trim();
        setSelectedText(text);
        
        if (text.length > 2) { // Even shorter minimum length for better usability
          // Show tooltip very close to the cursor
          setTooltipPosition({
            x: e.clientX,
            y: e.clientY - 10 // Position tooltip just above the cursor
          });
          setShowTooltip(true);
        }
      } else {
        setShowTooltip(false);
      }
    };

    // Handle mouse down for selection box
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't start selection if right-click or during text selection
      if (e.button === 2 || window.getSelection()?.toString()) return;
      
      // If Screenshot mode toggle is active
      if (e.ctrlKey || e.metaKey) {
        const container = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (!container) return;
        
        // Get position relative to the scroll container
        const rect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const scrollLeft = container.scrollLeft;
        
        const x = e.clientX - rect.left + scrollLeft;
        const y = e.clientY - rect.top + scrollTop;
        
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        setIsSelecting(true);
        setSelectionBox({
          left: x,
          top: y,
          width: 0,
          height: 0,
          visible: true
        });
        
        // Prevent default text selection
        e.preventDefault();
      }
    };

    // Handle mouse move for selection box
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting) return;
      
      const container = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollLeft = container.scrollLeft;
      
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;
      
      setSelectionEnd({ x, y });
      
      // Calculate selection box dimensions
      const left = Math.min(selectionStart.x, x);
      const top = Math.min(selectionStart.y, y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);
      
      setSelectionBox({
        left,
        top,
        width,
        height,
        visible: true
      });
    };
    
    // Capture the selected area as an image
    const captureSelectedArea = async () => {
      if (!isSelecting || !pdfContainerRef.current) return;
      
      setIsSelecting(false);
      setSelectionBox(prev => ({ ...prev, visible: false }));
      
      try {
        const container = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (!container) return;
        
        // Use html2canvas to capture the selected area
        const canvas = await html2canvas(container as HTMLElement, {
          x: selectionBox.left,
          y: selectionBox.top,
          width: selectionBox.width,
          height: selectionBox.height,
        });
        
        const imageData = canvas.toDataURL('image/png');
        
        if (onImageCaptured) {
          onImageCaptured(imageData);
          toast({
            title: "Image Captured",
            description: "The selected area has been sent to the chat.",
          });
        }
      } catch (error) {
        console.error("Error capturing image:", error);
        toast({
          title: "Capture Failed",
          description: "Failed to capture the selected area.",
          variant: "destructive",
        });
      }
    };

    // Handle tooltip click to send text to chat
    const handleExplainClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (selectedText && onTextSelected) {
        onTextSelected(selectedText);
        setShowTooltip(false);
      }
    };
    
    // Hide tooltip when clicking elsewhere
    useEffect(() => {
      const handleClickOutside = () => {
        setShowTooltip(false);
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Enhanced search functionality with improved highlighting
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

    // Navigate through search results
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

    return (
      <div className="h-full flex flex-col bg-gray-50 font-roboto" data-pdf-viewer>
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
          </div>
          
          {/* Screenshot tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-black flex items-center gap-1"
                onClick={() => toast({
                  title: "Screenshot Mode",
                  description: "Press Ctrl (or Cmd) and drag to select an area to capture.",
                })}
              >
                <Screenshot className="h-3.5 w-3.5" />
                <span>Capture</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-white">
              <p>Hold Ctrl (or Cmd) and drag to capture</p>
            </TooltipContent>
          </Tooltip>
          
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
          <TooltipProvider>
            <ScrollArea className="flex-1" ref={pdfContainerRef}>
              <div 
                className="flex flex-col items-center py-4" 
                onMouseUp={handleDocumentMouseUp}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                style={{ position: 'relative' }}
              >
                {/* Selection box for screenshot */}
                {selectionBox.visible && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/20 z-50 pointer-events-none"
                    style={{
                      left: `${selectionBox.left}px`,
                      top: `${selectionBox.top}px`,
                      width: `${selectionBox.width}px`,
                      height: `${selectionBox.height}px`,
                    }}
                  >
                    <div className="absolute bottom-0 right-0 bg-white text-xs px-1 border border-blue-500">
                      Capture
                    </div>
                  </div>
                )}
                
                {/* Selection Tooltip - positioned very close to cursor */}
                {showTooltip && (
                  <>
                    {renderTooltipContent ? (
                      renderTooltipContent()
                    ) : (
                      <button 
                        className="fixed bg-white text-black border border-gray-300 px-3 py-1.5 text-sm rounded shadow-lg z-50 cursor-pointer hover:bg-gray-100"
                        style={{ 
                          left: `${tooltipPosition.x}px`, 
                          top: `${tooltipPosition.y - 25}px`,
                          transform: 'translateX(-50%)',
                          pointerEvents: 'all'
                        }}
                        onClick={handleExplainClick}
                        onMouseDown={(e) => e.stopPropagation()} 
                      >
                        Explain
                      </button>
                    )}
                  </>
                )}
              
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
              </div>
            </ScrollArea>
          </TooltipProvider>
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
