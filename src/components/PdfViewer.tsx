import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, MessageSquare, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, PositionedTooltip } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getCurrentPdfData } from "@/utils/pdfStorage";
import { createSelectionRect, captureElementArea, toggleTextSelection } from "@/utils/captureUtils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the PDF.js worker with proper URL
function setupPdfWorker() {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const pdfJsVersion = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
    console.log(`PdfViewer worker set to version: ${pdfJsVersion} from CDN with https`);
  }
}

// Initialize worker immediately
setupPdfWorker();

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  onImageCaptured?: (imageData: string) => void;
  renderTooltipContent?: () => React.ReactNode;
  highlightByDefault?: boolean; // Added the missing prop
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, onImageCaptured, renderTooltipContent, highlightByDefault = false }, ref) => {
    // Original PdfViewer component implementation with modifications
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
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [pdfKey, setPdfKey] = useState<string | null>(null);
    
    // Text selection tooltip states
    const [selectedText, setSelectedText] = useState<string>("");
    const selectionTooltipRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    // New tooltip positioning state
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showSelectionTooltip, setShowSelectionTooltip] = useState(false);
    const tooltipTextRef = useRef<string>("");
    
    // New snapshot mode state
    const [isSnapshotMode, setIsSnapshotMode] = useState(false);
    const selectionRectRef = useRef<ReturnType<typeof createSelectionRect> | null>(null);

    // Add a state to track whether we're currently processing an image capture
    const [isProcessingCapture, setIsProcessingCapture] = useState(false);
    
    // Add missing captureError state
    const [captureError, setCaptureError] = useState<string | null>(null);

    // Add a ref for the search input to focus when search is opened
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadPdfData = async () => {
      try {
        setIsLoading(true);
        const data = await getCurrentPdfData();
        
        if (data) {
          setPdfData(data);
          console.log("PDF data loaded successfully from IndexedDB");
        } else {
          setLoadError("No PDF found. Please upload a PDF document first.");
          toast({
            title: "No PDF Found",
            description: "Please upload a PDF document first.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error retrieving PDF data:", error);
        setLoadError("Could not load the PDF document.");
        toast({
          title: "Error loading PDF",
          description: "Could not load the PDF document.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      setupPdfWorker();
      loadPdfData();
    }, []);
    
    useEffect(() => {
      const handlePdfSwitch = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.pdfKey) {
          setPdfKey(customEvent.detail.pdfKey);
          // Reset view state
          setSearchQuery("");
          setSearchResults([]);
          setCurrentSearchIndex(-1);
          // Load the new PDF
          loadPdfData();
        }
      };
      
      window.addEventListener('pdfSwitched', handlePdfSwitch);
      return () => {
        window.removeEventListener('pdfSwitched', handlePdfSwitch);
      };
    }, [toast]);

    // Store the viewport ref when the scroll area is mounted
    useEffect(() => {
      if (pdfContainerRef.current) {
        viewportRef.current = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      }
    }, [pdfContainerRef.current]);

    // Add new effect to focus search input when search is toggled
    useEffect(() => {
      if (showSearch && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [showSearch]);

    // Updated effect for text selection to respect highlightByDefault prop
    useEffect(() => {
      let selectionTimeout: number | null = null;
      
      // Enable text selection by default if highlightByDefault is true
      if (highlightByDefault) {
        toggleTextSelection(true);
      }
      
      const handleTextSelection = () => {
        const selection = window.getSelection();
        
        // Clear any existing timeout
        if (selectionTimeout) {
          window.clearTimeout(selectionTimeout);
          selectionTimeout = null;
        }
        
        // Only proceed if we have a valid selection
        if (selection && !selection.isCollapsed) {
          const text = selection.toString().trim();
          if (text) {
            setSelectedText(text);
            tooltipTextRef.current = text;
            
            // Get the precise position for tooltip
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (pdfContainerRef.current && viewportRef.current) {
              // Calculate the position relative to the PDF container's scroll position
              const containerRect = pdfContainerRef.current.getBoundingClientRect();
              const scrollTop = viewportRef.current.scrollTop;
              
              const x = rect.left + (rect.width / 2) - containerRect.left;
              // Key change: Y position is relative to the page, not the viewport
              const y = rect.top + scrollTop - containerRect.top;
              
              setTooltipPosition({ x, y });
              
              // Show tooltip with slight delay to ensure position is updated
              selectionTimeout = window.setTimeout(() => {
                setShowSelectionTooltip(true);
              }, 50);
            }
          }
        } else if (!selectionTooltipRef.current?.contains(document.activeElement)) {
          // Hide tooltip if clicked elsewhere and not on tooltip itself
          // But don't hide if user clicked the tooltip button
          if (document.activeElement !== selectionTooltipRef.current) {
            selectionTimeout = window.setTimeout(() => {
              if (!document.getSelection()?.toString()) {
                setShowSelectionTooltip(false);
              }
            }, 100);
          }
        }
      };
      
      document.addEventListener('mouseup', handleTextSelection);
      
      return () => {
        document.removeEventListener('mouseup', handleTextSelection);
        if (selectionTimeout) window.clearTimeout(selectionTimeout);
      };
    }, [highlightByDefault]);

    // Listen for capture complete events to update UI
    useEffect(() => {
      const handleCaptureDone = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (selectionRectRef.current && customEvent.detail?.success) {
          // Update the selection rectangle UI to show completion
          selectionRectRef.current.captureComplete();
          
          // After a short delay, reset snapshot mode
          setTimeout(() => {
            if (selectionRectRef.current) {
              // Don't cancel selection yet - let the success UI remain visible
              // Instead we'll just exit snapshot mode
              setIsSnapshotMode(false);
              setIsProcessingCapture(false);
            }
          }, 1000);
        }
      };
      
      window.addEventListener('captureDone', handleCaptureDone as EventListener);
      
      return () => {
        window.removeEventListener('captureDone', handleCaptureDone as EventListener);
      };
    }, []);

    // Updated effect for snapshot mode with capture tooltip - modified to prevent duplicate events
    useEffect(() => {
      if (!pdfContainerRef.current || !viewportRef.current) return;
      
      // Clean up any existing selection rect
      if (selectionRectRef.current) {
        selectionRectRef.current.destroy();
        selectionRectRef.current = null;
      }
      
      if (isSnapshotMode) {
        // Disable text selection when entering snapshot mode
        toggleTextSelection(false);
        
        // Create new selection rect handler when entering snapshot mode
        selectionRectRef.current = createSelectionRect(pdfContainerRef.current);
        
        // Add mouse event handlers for snapshot mode
        const viewport = viewportRef.current;
        
        const handleMouseDown = (e: MouseEvent) => {
          if (!isSnapshotMode || !selectionRectRef.current) return;
          selectionRectRef.current.startSelection(e.clientX, e.clientY);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!isSnapshotMode || !selectionRectRef.current) return;
          selectionRectRef.current.moveSelection(e.clientX, e.clientY);
        };
        
        const handleMouseUp = (e: MouseEvent) => {
          if (!isSnapshotMode || !selectionRectRef.current) return;
          selectionRectRef.current.endSelection(e.clientX, e.clientY);
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape" && isSnapshotMode) {
            // Cancel selection on Escape key
            if (selectionRectRef.current) {
              selectionRectRef.current.cancelSelection();
            }
            setIsSnapshotMode(false);
            // Re-enable text selection when exiting snapshot mode
            toggleTextSelection(true);
          }
        };
        
        // Add new handler for the captureArea custom event with safeguards against duplicate events
        const handleCaptureArea = async (e: Event) => {
          const customEvent = e as CustomEvent;
          if (!customEvent.detail?.rect || !pdfContainerRef.current || isProcessingCapture) return;
          
          // Set processing flag to true to prevent duplicate captures
          setIsProcessingCapture(true);
          
          const rect = customEvent.detail.rect;
          
          try {
            // Capture the selected area
            const imageData = await captureElementArea(pdfContainerRef.current, rect);
            
            if (imageData && onImageCaptured) {
              // Send captured image to chat
              onImageCaptured(imageData);
              
              toast({
                title: "Area captured",
                description: "The selected area has been sent to chat",
              });
            }
          } catch (error) {
            console.error("Error capturing area:", error);
            toast({
              title: "Capture failed",
              description: "Failed to capture the selected area",
              variant: "destructive"
            });
            
            // Reset the capturing state and clean up
            if (selectionRectRef.current) {
              selectionRectRef.current.setCapturing(false);
              selectionRectRef.current.cancelSelection();
            }
            setIsSnapshotMode(false);
            // Re-enable text selection when capture fails
            toggleTextSelection(true);
            
            // Reset processing flag after a short delay
            setTimeout(() => {
              setIsProcessingCapture(false);
            }, 500);
          }
        };
        
        // Add event listeners
        viewport.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("keydown", handleKeyDown);
        pdfContainerRef.current.addEventListener("captureArea", handleCaptureArea);
        
        // Set cursor to crosshair when in snapshot mode
        viewport.style.cursor = "crosshair";
        
        return () => {
          // Remove event listeners when cleaning up
          viewport.removeEventListener("mousedown", handleMouseDown);
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
          window.removeEventListener("keydown", handleKeyDown);
          if (pdfContainerRef.current) {
            pdfContainerRef.current.removeEventListener("captureArea", handleCaptureArea);
          }
          
          // Reset cursor
          viewport.style.cursor = "";
          
          // Re-enable text selection when unmounting
          toggleTextSelection(true);
        };
      } else {
        // Re-enable text selection when exiting snapshot mode
        toggleTextSelection(true);
      }
    }, [isSnapshotMode, toast, onImageCaptured, isProcessingCapture]);

    const handleExplainText = () => {
      if (selectedText && onTextSelected) {
        onTextSelected(selectedText);
        
        // Dispatch custom event for opening chat with text
        window.dispatchEvent(
          new CustomEvent('openChatWithText', { detail: { text: selectedText } })
        );
        
        // Do NOT clear selection - keep the tooltip visible and the text highlighted
        setShowSelectionTooltip(true);
      }
    };

    // Toggle search visibility
    const toggleSearch = () => {
      setShowSearch(prevState => !prevState);
      if (!showSearch) {
        // Reset search results when opening search
        setSearchResults([]);
        setCurrentSearchIndex(-1);
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

    useImperativeHandle(ref, () => ({
      scrollToPage
    }), [numPages]);
    
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

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      // Initialize the array with the correct number of null elements
      pagesRef.current = Array(numPages).fill(null);
      if (onPdfLoaded) {
        onPdfLoaded();
      }
      setLoadError(null);
    };

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

    // Handle search input keydown event
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      } else if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    // Calculate optimal width for PDF pages
    const getOptimalPageWidth = () => {
      if (!pdfContainerRef.current) return undefined;
      
      const containerWidth = pdfContainerRef.current.clientWidth;
      // Use the full container width
      return containerWidth - 16; // Just a small margin for aesthetics
    };

    // Add useEffect to set worker
    useEffect(() => {
      // Set the PDF.js worker source if not already set
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        const pdfJsVersion = pdfjs.version;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
        console.log(`PdfViewer worker set to version: ${pdfJsVersion} from CDN with https`);
      }
    }, []);

    return (
      <div className="h-full flex flex-col bg-gray-50" data-pdf-viewer>
        {/* PDF Toolbar */}
        <div className="bg-white border-b px-1 py-0 flex flex-nowrap items-center justify-between gap-0.5 z-10 min-h-[30px] h-8">
          {/* Zoom Controls with percentage display */}
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-black p-0" 
              onClick={zoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs w-10 text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-black p-0" 
              onClick={zoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-black p-0" 
              onClick={resetZoom}
              title="Reset Zoom"
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Search Section - Modified to be toggled */}
          <div className="flex-1 mx-0.5">
            {showSearch ? (
              <div className="flex items-center">
                <Input
                  ref={searchInputRef}
                  placeholder="Search in document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 text-xs mr-0.5"
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 flex items-center gap-0.5 text-black px-1"
                  onClick={handleSearch}
                >
                  <Search className="h-3 w-3" />
                  <span className="text-xs">Find</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 flex items-center text-black px-1"
                  onClick={() => setShowSearch(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 flex items-center gap-0.5 text-black px-1"
                  onClick={toggleSearch}
                >
                  <Search className="h-3 w-3" />
                  <span className="text-xs">Search</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* Search Navigation - Only show when search results exist */}
          {searchResults.length > 0 && showSearch && (
            <div className="flex items-center gap-1">
              <span className="text-xs">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <div className="flex gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1 text-black"
                  onClick={() => navigateSearch('prev')}
                >
                  ←
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1 text-black"
                  onClick={() => navigateSearch('next')}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* PDF Content */}
        {pdfData ? (
          <ScrollArea className="flex-1" ref={pdfContainerRef}>
            <div 
              className="flex flex-col items-center py-4 relative"
            >
              {/* Snapshot mode indicator */}
              {isSnapshotMode && (
                <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
                  <span>{isProcessingCapture ? "Processing capture..." : "Draw to capture area"}</span>
                  {!isProcessingCapture && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 bg-blue-600 hover:bg-blue-700 p-1 h-6" 
                      onClick={() => setIsSnapshotMode(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
              
              {/* NEW Selection Tooltip - positioned absolutely within the PDF container */}
              {showSelectionTooltip && (
                <PositionedTooltip
                  ref={selectionTooltipRef}
                  show={showSelectionTooltip}
                  x={tooltipPosition.x}
                  y={tooltipPosition.y - 40} // Offset it above the text
                  className="transform -translate-x-1/2 shadow-lg"
                >
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="flex items-center gap-1 text-xs p-1 h-7"
                    onClick={handleExplainText}
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Explain</span>
                  </Button>
                </PositionedTooltip>
              )}
              
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                className="w-full"
                loading={<div className="text-center py-4">Loading PDF...</div>}
                error={
                  <div className="text-center py-4 text-red-500">
                    {loadError || "Failed to load PDF. Please try again."}
                  </div>
                }
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
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading PDF...</p>
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-red-500 font-medium mb-2">{loadError || "No PDF available"}</p>
                <p className="text-gray-500">Please return to the upload page and select a PDF document.</p>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Upload Page
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Display temporary message if a capture error occurs */}
        {captureError && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a
