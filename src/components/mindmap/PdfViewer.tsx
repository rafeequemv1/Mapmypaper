
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPdfData, getCurrentPdf } from "@/utils/pdfStorage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
  scrollTo?: string | null;
  pdfKey?: string | null;
  onPdfKeyChange?: (pdfKey: string | null) => void;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onImageCaptured, onPdfLoaded, renderTooltipContent, scrollTo, pdfKey, onPdfKeyChange }, ref) => {
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
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
    const [showTextTooltip, setShowTextTooltip] = useState(false);
    const textTooltipRef = useRef<HTMLDivElement>(null);
    const selectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Area selection mode state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const selectionRectRef = useRef<any | null>(null);
    const activePdfPageRef = useRef<number | null>(null);
    const isDrawingRef = useRef<boolean>(false);

    const loadPdfData = async () => {
      try {
        setIsLoading(true);
        
        // First, get the current PDF key
        const currentPdfKey = getCurrentPdf();
        
        if (currentPdfKey) {
          // Then get the actual PDF data using the key
          const data = await getPdfData(currentPdfKey);
          
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
        } else {
          setLoadError("No PDF selected. Please upload a PDF document first.");
          toast({
            title: "No PDF Selected",
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

    // Initial load
    useEffect(() => {
      loadPdfData();
    }, []);
    
    // Listen for PDF switch events
    useEffect(() => {
      const handlePdfSwitch = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.pdfKey) {
          if (onPdfKeyChange) {
            onPdfKeyChange(customEvent.detail.pdfKey);
          }
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
    }, [onPdfKeyChange]);

    // Handle text selection in the PDF
    useEffect(() => {
      const handleSelection = () => {
        const selection = window.getSelection();
        
        if (selection && !selection.isCollapsed) {
          const text = selection.toString().trim();
          
          if (text.length > 5) {  // Only show tooltip for meaningful selections
            setSelectedText(text);
            
            // Get position for the tooltip
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setSelectionPosition({
              x: rect.left + (rect.width / 2),
              y: rect.top - 10  // Position above the selection
            });
            
            setShowTextTooltip(true);
            
            // Clear any existing timeout
            if (selectionTimeout.current) {
              clearTimeout(selectionTimeout.current);
            }
            
            // Hide tooltip after 5 seconds if not interacted with
            selectionTimeout.current = setTimeout(() => {
              setShowTextTooltip(false);
            }, 5000);
          }
        }
      };
      
      // Add listener for mouseup event within the PDF container
      const pdfContainer = document.querySelector('[data-pdf-viewer]');
      
      if (pdfContainer) {
        pdfContainer.addEventListener('mouseup', handleSelection);
        
        return () => {
          pdfContainer.removeEventListener('mouseup', handleSelection);
        };
      }
      
      return undefined;
    }, []);
    
    // Close tooltip when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tooltipRef.current && 
          !tooltipRef.current.contains(event.target as Node)
        ) {
          setShowTextTooltip(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Function to handle explanation request
    const handleExplainText = () => {
      if (selectedText && onTextSelected) {
        // Dispatch a custom event to open the chat with the selected text
        onTextSelected(selectedText);
        
        setShowTextTooltip(false);
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
        }
      }
    };

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

    const setPageRef = (index: number) => (element: HTMLDivElement | null) => {
      if (pagesRef.current && index >= 0 && index < pagesRef.current.length) {
        pagesRef.current[index] = element;
      }
    };

    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setScale(1);

    const getOptimalPageWidth = () => {
      if (!pdfContainerRef.current) return undefined;
      
      const containerWidth = pdfContainerRef.current.clientWidth;
      // Use the full container width
      return containerWidth - 16; // Just a small margin for aesthetics
    };

    const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
    };

    // Add text tooltip component
    const TextSelectionTooltip = () => {
      if (!showTextTooltip || !selectionPosition) return null;
      
      return (
        <div
          ref={tooltipRef}
          className="absolute bg-white shadow-lg rounded-lg p-2 z-50"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <button
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            onClick={handleExplainText}
          >
            Explain Selection
          </button>
        </div>
      );
    };

    // PDF Toolbar
    return (
      <div className="h-full flex flex-col bg-gray-50" data-pdf-viewer>
        {/* PDF Toolbar */}
        <div className="bg-white border-b px-1 py-0 flex flex-nowrap items-center gap-0.5 z-10 min-h-[30px] h-8">
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
          
          {/* Search Input */}
          <div className="flex-1 mx-0.5">
            <div className="flex items-center">
              <Input
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6 text-xs mr-0.5"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 flex items-center gap-0.5 text-black px-1"
                onClick={handleSearch}
              >
                <Search className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => navigateSearch('prev')}
                disabled={searchResults.length === 0}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => navigateSearch('next')}
                disabled={searchResults.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
          
          {/* Area Selection Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelectionMode ? "secondary" : "ghost"}
                  size="icon"
                  className="h-6 w-6 text-black p-0 ml-1"
                  onClick={toggleSelectionMode}
                >
                  <Crop className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{isSelectionMode ? "Exit Selection Mode" : "Select Area"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* PDF Content */}
        {loadError ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-red-500 mb-2">{loadError}</p>
              <p className="text-sm text-gray-500">Please upload a PDF document to get started.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 relative" ref={pdfContainerRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-2 text-sm text-gray-500">Loading PDF...</p>
                </div>
              </div>
            ) : pdfData ? (
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                      <p className="mt-2 text-sm text-gray-500">Loading PDF...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="h-full flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">Failed to load PDF</p>
                      <p className="text-sm text-gray-500">The document could not be loaded.</p>
                    </div>
                  </div>
                }
              >
                <div className="flex flex-col items-center py-2">
                  {Array.from(new Array(numPages), (el, index) => (
                    <div 
                      key={`page_${index + 1}`} 
                      ref={setPageRef(index)} 
                      className="mb-4 relative shadow-lg"
                      data-page-number={index + 1}
                    >
                      <Page
                        key={`page_${index + 1}_${scale}`}
                        pageNumber={index + 1}
                        width={getOptimalPageWidth()}
                        scale={scale}
                        onRenderSuccess={onPageRenderSuccess}
                        loading={
                          <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </Document>
            ) : (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No PDF loaded</p>
                  <p className="text-sm text-gray-400">Please upload a PDF document to get started.</p>
                </div>
              </div>
            )}
          </ScrollArea>
        )}
        
        {/* Selection tooltips */}
        <TextSelectionTooltip />
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
