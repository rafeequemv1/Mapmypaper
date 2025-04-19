import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { retrievePDF } from "@/utils/pdfStorage";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, renderTooltipContent }, ref) => {
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
    
    // Text selection states
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);
    const [showExplainTooltip, setShowExplainTooltip] = useState(false);

    const refreshPdfData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log("Refreshing PDF data from storage...");
        const pdfData = await retrievePDF();
        
        if (pdfData) {
          console.log("PDF retrieved, length:", pdfData.length);
          setPdfData(null); // Force reload
          setTimeout(() => setPdfData(pdfData), 100);
        } else {
          console.log("No PDF data found in storage");
          setLoadError("No PDF data found. Please upload a document first.");
          toast({
            title: "No PDF Found",
            description: "Please upload a PDF document first.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error refreshing PDF data:", error);
        setLoadError("Error loading PDF. Please try again.");
        toast({
          title: "Error Refreshing PDF",
          description: "Could not reload the PDF document.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Load PDF from IndexedDB when component mounts
    useEffect(() => {
      const loadPdf = async () => {
        try {
          setIsLoading(true);
          console.log("PdfViewer initializing - loading PDF from storage");
          
          const pdfData = await retrievePDF();
          
          if (pdfData) {
            console.log("PDF data retrieved, length:", pdfData.length);
            setPdfData(pdfData);
          } else {
            console.log("No PDF data found in storage");
            setLoadError("No PDF data found. Please upload a document first.");
            toast({
              title: "No PDF Found",
              description: "Please upload a PDF document first.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error retrieving PDF data:", error);
          setLoadError("Error loading PDF. Please try again.");
          toast({
            title: "Error loading PDF",
            description: "Could not load the PDF document.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      loadPdf();
    }, [toast]);

    // Simplified text selection handler
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "") {
        const text = selection.toString().trim();
        
        if (text.length > 2) {
          setSelectedText(text);
          
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setSelectionPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top - 10
          });
          
          setShowExplainTooltip(true);
        }
      } else {
        setShowExplainTooltip(false);
        setSelectionPosition(null);
      }
    };
    
    // Function to handle explain button click for text
    const handleExplain = () => {
      if (selectedText && onTextSelected) {
        onTextSelected(selectedText);
        setShowExplainTooltip(false);
        setSelectionPosition(null);
      }
    };

    // Handle search functionality
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

    // Navigation functions for search
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

    // Handle document loaded
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      console.log(`PDF loaded successfully with ${numPages} pages`);
      setNumPages(numPages);
      setIsLoading(false);
      setLoadError(null);
      // Initialize the array with the correct number of null elements
      pagesRef.current = Array(numPages).fill(null);
      if (onPdfLoaded) {
        onPdfLoaded();
      }
    };

    // Handle document load error
    const onDocumentLoadError = (error: Error) => {
      console.error("Error loading PDF document:", error);
      setIsLoading(false);
      setLoadError("Failed to load PDF. The file might be corrupted or in an unsupported format.");
      toast({
        title: "Error Loading PDF",
        description: "Could not load the PDF document. Try uploading it again.",
        variant: "destructive",
      });
    };

    // Handle page render success to adjust container height
    const onPageRenderSuccess = (page: any) => {
      setPageHeight(page.height);
    };

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

    // Page scrolling functionality
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

    // useImperativeHandle for scrollToPage
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

    return (
      <div className="h-full flex flex-col bg-gray-50" data-pdf-viewer>
        {/* PDF Toolbar - removed Area Selection Button */}
        <div className="bg-white border-b p-1 flex flex-wrap items-center gap-2 z-10">
          {/* Refresh Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-black" 
            onClick={refreshPdfData}
            title="Refresh PDF"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          
          {/* Zoom Controls with percentage display */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-black" 
              onClick={zoomOut}
              title="Zoom Out"
              disabled={isLoading || !pdfData}
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
              disabled={isLoading || !pdfData}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-black" 
              onClick={resetZoom}
              title="Reset Zoom"
              disabled={isLoading || !pdfData}
            >
              <RotateCw className="h-3.5 w-3.5" />
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
                disabled={isLoading || !pdfData}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 flex items-center gap-1 text-black"
                onClick={handleSearch}
                disabled={isLoading || !pdfData}
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

        {/* PDF Content remains the same */}
        {/* Removed image selection tooltip and related divs */}
        {isLoading && !pdfData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-96 w-3/4 mb-2" />
            <Skeleton className="h-4 w-28 mb-8" />
            <Skeleton className="h-96 w-3/4 mb-2" />
            <Skeleton className="h-4 w-28" />
            <div className="mt-6 text-gray-500">Loading PDF...</div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full bg-red-50 p-6 text-center">
            <div className="bg-red-100 text-red-500 font-medium mb-4 p-4 rounded-md">
              {loadError}
            </div>
            <div className="text-gray-600 mb-6">
              If you were expecting a PDF to be available, try uploading it again.
            </div>
            <Button 
              onClick={refreshPdfData} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        ) : pdfData ? (
          <ScrollArea className="flex-1 relative" ref={pdfContainerRef}>
            {/* Floating Explain Tooltip for Text */}
            {showExplainTooltip && selectionPosition && (
              <div
                className="absolute z-50 bg-white border rounded-md shadow-md px-3 py-2 flex items-center gap-2"
                style={{
                  left: `${selectionPosition.x}px`,
                  top: `${selectionPosition.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                data-explain-tooltip
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-blue-600 hover:text-blue-800"
                  onClick={handleExplain}
                >
                  Explain This
                </Button>
              </div>
            )}
            
            <div 
              className="flex justify-center p-4"
              onMouseUp={handleDocumentMouseUp}
            >
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </div>
                }
                error={
                  <div className="flex justify-center py-12 text-red-500">
                    Failed to load PDF. Please check the file and try again.
                  </div>
                }
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div 
                    key={`page_${index + 1}`}
                    className="mb-8 shadow-md rounded-md overflow-hidden"
                    ref={setPageRef(index)}
                  >
                    <Page
                      pageNumber={index + 1}
                      width={getOptimalPageWidth()}
                      scale={scale}
                      onRenderSuccess={onPageRenderSuccess}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="bg-white"
                    />
                    <div className="text-center py-2 bg-white text-gray-500 text-sm border-t">
                      Page {index + 1} of {numPages}
                    </div>
                  </div>
                ))}
              </Document>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-center text-gray-500 mb-6">
              No PDF document found. Please upload a document.
            </div>
            <Button 
              onClick={refreshPdfData} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Check Again</span>
            </Button>
          </div>
        )}
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
