
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import { Search, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded }, ref) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [scale, setScale] = useState<number>(1);
    const [width, setWidth] = useState<number>(90);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
    const { toast } = useToast();

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

    // Handle text selection
    const handleDocumentMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "") {
        const text = selection.toString().trim();
        setSelectedText(text);
        if (text.length > 10) {
          // Only trigger for meaningful selections
          onTextSelected && onTextSelected(text);
        }
      }
    };

    // Search functionality
    const handleSearch = () => {
      if (!searchQuery.trim()) return;
      
      // Get all text content from PDF pages
      const results: string[] = [];
      const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
      
      textLayers.forEach((layer, pageIndex) => {
        const textContent = layer.textContent || '';
        const regex = new RegExp(searchQuery, 'gi');
        let match;
        
        while ((match = regex.exec(textContent)) !== null) {
          // Store page number for each match
          results.push(`page${pageIndex + 1}`);
        }
      });
      
      setSearchResults(results);
      
      if (results.length > 0) {
        setCurrentSearchIndex(0);
        scrollToPosition(results[0]);
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

    // Scroll to specific page
    const scrollToPage = (pageNumber: number) => {
      if (pageNumber < 1 || pageNumber > numPages) {
        console.warn(`Invalid page number: ${pageNumber}. Pages range from 1 to ${numPages}`);
        return;
      }
      
      const pageIndex = pageNumber - 1; // Convert to 0-based index
      const targetPage = pagesRef.current[pageIndex];
      
      if (targetPage && pdfContainerRef.current) {
        const scrollContainer = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          // Scroll the page into view
          targetPage.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Flash effect to highlight the page
          targetPage.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
          setTimeout(() => {
            targetPage.style.backgroundColor = '';
          }, 1500);
        }
      }
    };

    // Expose the scrollToPage method to parent components
    useImperativeHandle(ref, () => ({
      scrollToPage
    }), [numPages]);

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

    // Width adjustment
    const handleWidthChange = (value: number[]) => {
      setWidth(value[0]);
    };

    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* PDF Toolbar */}
        <div className="bg-white border-b p-2 flex flex-wrap items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={zoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={zoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={resetZoom}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-6 border-l mx-1"></div>
          
          {/* Width Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-xs whitespace-nowrap">Width:</span>
            <Slider 
              value={[width]} 
              min={50} 
              max={100} 
              step={5}
              onValueChange={handleWidthChange} 
              className="w-full max-w-[140px]"
            />
            <span className="text-xs w-8">{width}%</span>
          </div>
          
          {/* Search Controls */}
          <div className="flex items-center gap-1 ml-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="bg-white border-b p-2 flex gap-2 items-center">
            <Input
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8"
              onClick={handleSearch}
            >
              Search
            </Button>
            {searchResults.length > 0 && (
              <>
                <span className="text-xs">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => navigateSearch('prev')}
                  >
                    ←
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => navigateSearch('next')}
                  >
                    →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PDF Content */}
        {pdfData ? (
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
                    className="my-4 shadow-md mx-auto bg-white transition-colors duration-300"
                    ref={setPageRef(index)}
                    style={{ maxWidth: `${width}%` }}
                    data-page-number={index + 1}
                  >
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      onRenderSuccess={onPageRenderSuccess}
                      scale={scale}
                      width={Math.min(600, window.innerWidth - 60) * (width/100)}
                    />
                    <div className="text-center text-xs text-gray-500 py-1">
                      Page {index + 1} of {numPages}
                    </div>
                  </div>
                ))}
              </Document>
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
