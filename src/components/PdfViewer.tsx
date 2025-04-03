import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, Image } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { TooltipProvider } from "./ui/tooltip";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import html2canvas from "html2canvas";
import Selecto from "selecto";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
  onAreaSelected?: (imageData: string) => void;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, renderTooltipContent, onAreaSelected }, ref) => {
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
    const selectoRef = useRef<Selecto | null>(null);
    
    // Area selection related states
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
    const [currentSelection, setCurrentSelection] = useState<{ 
      x: number, y: number, width: number, height: number, pageElement: HTMLElement | null 
    } | null>(null);
    const selectionRef = useRef<HTMLDivElement | null>(null);
    const selectionOverlayRef = useRef<HTMLDivElement | null>(null);
    const explainButtonRef = useRef<HTMLButtonElement | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);

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

    // Initialize Selecto when PDF is loaded and selection mode is active
    useEffect(() => {
      if (!pdfContainerRef.current || !selectionMode || !numPages) return;
      
      const container = pdfContainerRef.current;
      const scrollContainer = container.querySelector('[data-radix-scroll-area-viewport]');
      
      if (!scrollContainer) return;
      
      // Clean up any previous instance
      if (selectoRef.current) {
        selectoRef.current.destroy();
      }
      
      if (!selectionOverlayRef.current) {
        const overlay = document.createElement('div');
        overlay.className = 'pdf-selection-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '50';
        overlay.style.cursor = 'crosshair';
        selectionOverlayRef.current = overlay;
        
        if (scrollContainer instanceof HTMLElement) {
          scrollContainer.style.position = 'relative';
          scrollContainer.appendChild(overlay);
        }
      }
      
      // Initialize Selecto
      const selecto = new Selecto({
        // The container to add a selection element
        container: selectionOverlayRef.current,
        // Area selection allows drag selection within the container
        dragContainer: selectionOverlayRef.current,
        // Enable only area selection (no clicking elements)
        selectableTargets: [],
        // Enable area selection
        selectByClick: false,
        selectFromInside: false,
        continueSelect: false,
        toggleContinueSelect: ["shift"],
        keyContainer: window,
        hitRate: 0,
      });
      
      // Handle selection start
      selecto.on("selectStart", (e) => {
        if (!selectionMode) return;
        setIsSelecting(true);
        
        // Remove any previous selection elements
        if (selectionRef.current && selectionRef.current.parentNode) {
          selectionRef.current.parentNode.removeChild(selectionRef.current);
          selectionRef.current = null;
        }
        
        if (explainButtonRef.current && explainButtonRef.current.parentNode) {
          explainButtonRef.current.parentNode.removeChild(explainButtonRef.current);
          explainButtonRef.current = null;
        }
      });
      
      // Handle selection in progress
      selecto.on("select", (e) => {
        if (!selectionMode || !e.rect) return;
        
        const { left, top, width, height } = e.rect;
        
        // Find which PDF page this selection is over
        let targetPage: HTMLElement | null = null;
        
        if (pagesRef.current.length > 0 && scrollContainer instanceof HTMLElement) {
          const scrollTop = scrollContainer.scrollTop;
          const containerRect = selectionOverlayRef.current?.getBoundingClientRect();
          
          for (const page of pagesRef.current) {
            if (!page) continue;
            
            const pageRect = page.getBoundingClientRect();
            
            if (!containerRect) continue;
            
            // Convert page position to overlay coordinates
            const pageTop = pageRect.top - containerRect.top + scrollTop;
            const pageBottom = pageRect.bottom - containerRect.top + scrollTop;
            
            // Check if selection overlaps with this page
            if ((top <= pageBottom && top + height >= pageTop)) {
              targetPage = page;
              break;
            }
          }
        }
        
        // Store current selection for later use
        setCurrentSelection({
          x: left,
          y: top,
          width,
          height,
          pageElement: targetPage
        });
      });
      
      // Handle selection end
      selecto.on("selectEnd", (e) => {
        if (!selectionMode || !currentSelection) return;
        
        setIsSelecting(false);
        
        // Only show explain button if selection is large enough
        if (currentSelection.width > 10 && currentSelection.height > 10 && currentSelection.pageElement) {
          createExplainButton();
        }
      });
      
      selectoRef.current = selecto;
      
      return () => {
        if (selectoRef.current) {
          selectoRef.current.destroy();
          selectoRef.current = null;
        }
        
        if (selectionOverlayRef.current && selectionOverlayRef.current.parentNode) {
          selectionOverlayRef.current.parentNode.removeChild(selectionOverlayRef.current);
          selectionOverlayRef.current = null;
        }
      };
    }, [selectionMode, numPages, currentSelection]);
    
    // Create "Explain" button
    const createExplainButton = () => {
      if (!currentSelection || !selectionOverlayRef.current) return;
      
      // Remove existing button if any
      if (explainButtonRef.current && explainButtonRef.current.parentNode) {
        explainButtonRef.current.parentNode.removeChild(explainButtonRef.current);
      }
      
      // Create button
      const button = document.createElement('button');
      button.textContent = 'Explain';
      button.className = 'pdf-explain-button bg-primary text-white px-2 py-1 rounded-md text-xs font-medium';
      button.style.position = 'absolute';
      button.style.left = `${currentSelection.x + currentSelection.width - 30}px`;
      button.style.top = `${currentSelection.y - 30}px`;
      button.style.zIndex = '200';
      button.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
      button.style.cursor = 'pointer';
      
      // Add click handler
      button.addEventListener('click', captureAndExplainSelection);
      
      // Add to overlay
      explainButtonRef.current = button;
      selectionOverlayRef.current.appendChild(button);
    };
    
    // Capture selected area using html2canvas
    const captureAndExplainSelection = async () => {
      if (!currentSelection || !currentSelection.pageElement) {
        toast({
          title: "Selection Error",
          description: "Could not determine which page was selected.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const targetPage = currentSelection.pageElement;
        const pageRect = targetPage.getBoundingClientRect();
        const overlayRect = selectionOverlayRef.current?.getBoundingClientRect();
        
        if (!overlayRect) return;
        
        // Convert overlay coordinates to page coordinates
        const scrollContainer = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        const scrollTop = scrollContainer instanceof HTMLElement ? scrollContainer.scrollTop : 0;
        const relativeTop = currentSelection.y - (pageRect.top - overlayRect.top + scrollTop);
        const relativeLeft = currentSelection.x - (pageRect.left - overlayRect.left);
        
        // Ensure we have positive values
        const captureOptions = {
          x: Math.max(0, relativeLeft),
          y: Math.max(0, relativeTop),
          width: currentSelection.width,
          height: currentSelection.height,
          backgroundColor: "#ffffff",
        };
        
        toast({
          title: "Capturing selection",
          description: "Please wait while we process your selection...",
        });
        
        // Use html2canvas to capture the selection
        const canvas = await html2canvas(targetPage, captureOptions);
        const imageData = canvas.toDataURL('image/png');
        
        // Call the callback with the image data
        if (onAreaSelected) {
          onAreaSelected(imageData);
        }
        
        // Clean up the selection
        removeSelectionAndButton();
        setSelectionMode(false);
        
      } catch (error) {
        console.error("Error capturing selection:", error);
        toast({
          title: "Capture Failed",
          description: "Failed to capture the selected area.",
          variant: "destructive",
        });
      }
    };
    
    // Remove selection rectangle and explain button
    const removeSelectionAndButton = () => {
      if (explainButtonRef.current && explainButtonRef.current.parentNode) {
        explainButtonRef.current.parentNode.removeChild(explainButtonRef.current);
        explainButtonRef.current = null;
      }
      
      if (selectoRef.current) {
        selectoRef.current.setSelectedTargets([]);
      }
      
      setCurrentSelection(null);
    };

    // Handle text selection - simplified to just pass the text without showing tooltip
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      // Skip if in selection mode
      if (selectionMode) return;
      
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "" && onTextSelected) {
        const text = selection.toString().trim();
        
        // If text is selected and has minimum length, call the callback without showing tooltip
        if (text.length > 2) {
          onTextSelected(text);
        }
      }
    };

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
    const [scale, setScale] = useState<number>(1);

    // Calculate optimal width for PDF pages
    const getOptimalPageWidth = () => {
      if (!pdfContainerRef.current) return undefined;
      
      const containerWidth = pdfContainerRef.current.clientWidth;
      // Use the full container width
      return containerWidth - 16; // Just a small margin for aesthetics
    };
    
    // Toggle selection mode
    const toggleSelectionMode = () => {
      setSelectionMode(prev => !prev);
      if (!selectionMode) {
        toast({
          title: "Selection Mode Enabled",
          description: "Click and drag to select an area to explain.",
        });
      } else {
        // Clean up any selections when disabling
        removeSelectionAndButton();
      }
    };

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
            {/* Selection Mode Toggle Button */}
            <Button
              variant={selectionMode ? "default" : "ghost"}
              size="sm"
              className={`h-7 flex items-center gap-1 ${selectionMode ? 'bg-primary text-white' : 'text-black'}`}
              onClick={toggleSelectionMode}
              title={selectionMode ? "Disable Selection Mode" : "Enable Selection Mode"}
            >
              <Image className="h-3.5 w-3.5" />
              <span className="text-xs">Select Area</span>
            </Button>
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
          <TooltipProvider>
            <ScrollArea className="flex-1" ref={pdfContainerRef}>
              <div 
                className="flex flex-col items-center py-4" 
                onMouseUp={handleDocumentMouseUp}
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
