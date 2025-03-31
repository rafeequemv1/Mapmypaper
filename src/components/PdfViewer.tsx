
import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, HelpCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  className?: string;
  onTogglePdf?: () => void;
  showPdf?: boolean;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
}

const PdfViewer = ({ 
  className, 
  onTogglePdf, 
  showPdf = true, 
  onExplainText,
  onRequestOpenChat
}: PdfViewerProps) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>("");
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedPdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      if (storedPdfData) {
        console.log("PDF data loaded, length:", storedPdfData.length);
        setPdfData(storedPdfData);
      } else {
        console.error("No PDF data found in sessionStorage");
      }
    } catch (error) {
      console.error("Error loading PDF data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        setContainerWidth(pdfContainerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(pdfContainerRef.current);
    
    return () => {
      if (pdfContainerRef.current) {
        resizeObserver.unobserve(pdfContainerRef.current);
      }
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`Document loaded with ${numPages} pages`);
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (pdfContainerRef.current) {
          const containerRect = pdfContainerRef.current.getBoundingClientRect();
          const x = rect.left + (rect.width / 2) - containerRect.left;
          const y = rect.bottom - containerRect.top;
          
          setPopoverPosition({ x, y });
        }
      } catch (error) {
        console.error("Error calculating popover position:", error);
        if (pdfContainerRef.current) {
          const containerRect = pdfContainerRef.current.getBoundingClientRect();
          setPopoverPosition({ 
            x: containerRect.width / 2, 
            y: containerRect.height / 2 
          });
        }
      }
    } else {
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (!newSelection || !newSelection.toString().trim()) {
          setSelectedText("");
          setPopoverPosition(null);
        }
      }, 100);
    }
  };

  const handleExplain = () => {
    if (selectedText) {
      console.log("Sending text to explain:", selectedText);
      
      if (onRequestOpenChat) {
        console.log("Requesting to open chat panel");
        onRequestOpenChat();
      }
      
      if (onExplainText) {
        onExplainText(selectedText);
      }
      
      setSelectedText("");
      setPopoverPosition(null);
      
      if (window.getSelection) {
        if (window.getSelection()?.empty) {
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {
          window.getSelection()?.removeAllRanges();
        }
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !pdfData) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setCurrentSearchIndex(0);
    
    try {
      const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');
      const results: number[] = [];
      
      textLayers.forEach((layer, pageIndex) => {
        const pageText = layer.textContent.toLowerCase();
        if (pageText.includes(searchQuery.toLowerCase())) {
          results.push(pageIndex + 1);
        }
      });
      
      if (results.length > 0) {
        setSearchResults(results);
        setCurrentPage(results[0]);
        toast({
          title: "Search Results",
          description: `Found ${results.length} pages with matches`,
        });
      } else {
        toast({
          title: "No Results",
          description: "No matches found in document",
        });
      }
    } catch (error) {
      console.error("Error searching PDF:", error);
      toast({
        title: "Search Error",
        description: "Failed to search document",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const navigateToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setCurrentPage(searchResults[nextIndex]);
  };

  const navigateToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setCurrentPage(searchResults[prevIndex]);
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const pageNumbers = Array.from(
    new Array(numPages),
    (_, index) => index + 1
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-muted/20 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-1 rounded hover:bg-muted text-muted-foreground"
                    onClick={toggleSearch}
                    aria-label="Search PDF"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Search document</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isSearching && (
              <div className="absolute top-full left-0 mt-2 flex bg-white border rounded-md shadow-md z-50">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search..."
                  className="border-none text-sm px-2 py-1 outline-none w-40"
                />
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || !pdfData}
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                  {searchResults.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={navigateToPrevSearchResult}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={navigateToNextSearchResult}
                      >
                        ↓
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsSearching(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Zoom in</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoading ? 'Loading PDF...' : `Page ${currentPage} of ${numPages}`}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="min-h-full p-4 flex flex-col items-center bg-muted/10 relative" 
          ref={pdfContainerRef}
          onMouseUp={handleTextSelection}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !pdfData ? (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
              <p>No PDF available</p>
              <p className="text-xs mt-2">Upload a PDF file to view it here</p>
            </div>
          ) : (
            <>
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => console.error("Error loading PDF:", error)}
                className="pdf-container relative"
                loading={
                  <div className="flex items-center justify-center h-20 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              >
                {pageNumbers.map(pageNumber => {
                  const pageWidth = Math.min(containerWidth - 32, 800) * scale; 
                  
                  return (
                    <div 
                      key={`page_${pageNumber}`} 
                      className="mb-4 shadow-md relative"
                      ref={pageNumber === currentPage ? currentPageRef : null}
                      onLoad={() => {
                        if (pageNumber === 1) setCurrentPage(1);
                      }}
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth || undefined}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        onRenderSuccess={() => {
                          const observer = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                              if (entry.isIntersecting) {
                                setCurrentPage(pageNumber);
                              }
                            });
                          }, { threshold: 0.5 });
                          
                          const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
                          if (pageElement) observer.observe(pageElement);
                          
                          return () => {
                            if (pageElement) observer.unobserve(pageElement);
                          };
                        }}
                      />
                    </div>
                  );
                })}
              </Document>

              {selectedText && popoverPosition && (
                <div 
                  className="absolute z-50 bg-background shadow-lg rounded-lg border p-2"
                  style={{ 
                    left: `${popoverPosition.x}px`, 
                    top: `${popoverPosition.y + 10}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1 text-xs"
                    onClick={handleExplain}
                  >
                    <HelpCircle className="h-3 w-3" />
                    Explain
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfViewer;
