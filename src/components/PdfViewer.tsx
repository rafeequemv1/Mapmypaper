import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, HelpCircle, RefreshCw, Crop } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useRef as useStateRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { retrievePDF } from "@/utils/pdfStorage";
import html2canvas from "html2canvas";

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  onImageSelected?: (imageData: string) => void;
  renderTooltipContent?: () => React.ReactNode;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, onImageSelected, renderTooltipContent }, ref) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1);
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
    const selectionBoxRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();
    const activeHighlightRef = useRef<HTMLElement | null>(null);
    const [scale, setScale] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    
    // Text selection states
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);
    const [showExplainTooltip, setShowExplainTooltip] = useState(false);
    
    // Area selection states
    const [isAreaSelectionMode, setIsAreaSelectionMode] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{x: number, y: number} | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedAreaPosition, setSelectedAreaPosition] = useState<{x: number, y: number} | null>(null);
    const [showImageExplainTooltip, setShowImageExplainTooltip] = useState(false);
    
    // Store the onTextSelected callback in a ref to avoid stale closures
    const onTextSelectedRef = useStateRef(onTextSelected);
    const onImageSelectedRef = useStateRef(onImageSelected);

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

    // Handle text selection
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      // Skip if we're in area selection mode
      if (isAreaSelectionMode) return;
      
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "") {
        const text = selection.toString().trim();
        
        // If text is selected and has minimum length, show tooltip
        if (text.length > 2) {
          setSelectedText(text);
          
          // Calculate position for tooltip
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Get the position relative to viewport
          setSelectionPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top - 10 // Position it slightly above the selection
          });
          
          setShowExplainTooltip(true);
        }
      } else {
        // Close the tooltip if no text is selected
        setShowExplainTooltip(false);
        setSelectionPosition(null);
      }
    };
    
    // Handle document click to hide tooltip when clicking elsewhere
    useEffect(() => {
      const handleDocumentClick = (e: MouseEvent) => {
        // If clicking outside the selection and tooltip
        if (showExplainTooltip && selectionPosition) {
          // Check if the click is within the tooltip
          const tooltipElement = document.querySelector('[data-explain-tooltip]');
          if (tooltipElement && !tooltipElement.contains(e.target as Node)) {
            // Get the current selection
            const selection = window.getSelection();
            // If there's no selection or it's empty, hide the tooltip
            if (!selection || selection.toString().trim() === "") {
              setShowExplainTooltip(false);
              setSelectionPosition(null);
            }
          }
        }
        
        // Also handle image tooltip clicks
        if (showImageExplainTooltip && selectedAreaPosition) {
          // Check if the click is within the tooltip
          const tooltipElement = document.querySelector('[data-image-explain-tooltip]');
          if (tooltipElement && !tooltipElement.contains(e.target as Node)) {
            setShowImageExplainTooltip(false);
            setSelectedAreaPosition(null);
          }
        }
      };
      
      document.addEventListener('mousedown', handleDocumentClick);
      
      return () => {
        document.removeEventListener('mousedown', handleDocumentClick);
      };
    }, [showExplainTooltip, selectionPosition, showImageExplainTooltip, selectedAreaPosition]);
    
    // Function to handle explain button click for text
    const handleExplain = () => {
      if (selectedText && onTextSelectedRef.current) {
        onTextSelectedRef.current(selectedText);
        setShowExplainTooltip(false);
        setSelectionPosition(null);
      }
    };
    
    // Improved function to handle explain button click for images
    const handleExplainImage = async () => {
      if (!selectionStart || !selectionEnd || !onImageSelectedRef.current) return;
      
      try {
        // Use the document element as the capture target
        const viewport = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (!viewport) {
          console.error("Could not find PDF viewport");
          return;
        }
        
        // Get the scroll position
        const scrollTop = viewport.scrollTop || 0;
        
        // Calculate selection area in document coordinates
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionStart.x - selectionEnd.x);
        const height = Math.abs(selectionStart.y - selectionEnd.y);
        
        // Ensure minimum selection size
        if (width < 10 || height < 10) {
          toast({
            title: "Selection Too Small",
            description: "Please select a larger area to explain.",
            variant: "destructive"
          });
          return;
        }
        
        // Create a temporary div to position over the selected area
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = `${left}px`;
        tempDiv.style.top = `${top}px`;
        tempDiv.style.width = `${width}px`;
        tempDiv.style.height = `${height}px`;
        tempDiv.style.backgroundColor = 'transparent';
        tempDiv.style.border = '2px solid transparent';
        tempDiv.style.zIndex = '-1';
        
        // Add to document, capture, then remove
        document.body.appendChild(tempDiv);
        
        // Create full page screenshot
        const documentElement = document.documentElement;
        const canvas = await html2canvas(documentElement, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          ignoreElements: (element) => {
            // Ignore elements that are not part of the PDF content
            return !element.closest('[data-radix-scroll-area-viewport]') && 
                   !element.closest('.react-pdf__Document') &&
                   element !== tempDiv;
          }
        });
        
        // Create a new canvas for the cropped selection
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = width;
        croppedCanvas.height = height;
        const ctx = croppedCanvas.getContext('2d');
        
        if (ctx) {
          // Calculate the absolute position of the selection in the screenshot
          const rect = tempDiv.getBoundingClientRect();
          const canvasLeft = rect.left;
          const canvasTop = rect.top;
          
          // Draw only the selected portion to the new canvas
          ctx.drawImage(
            canvas, 
            canvasLeft, 
            canvasTop, 
            width, 
            height, 
            0, 
            0, 
            width, 
            height
          );
          
          // Convert to base64 data URL
          const imageData = croppedCanvas.toDataURL('image/png');
          
          // Remove the temporary div
          document.body.removeChild(tempDiv);
          
          // Pass to parent component
          onImageSelectedRef.current(imageData);
          
          // Hide tooltip
          setShowImageExplainTooltip(false);
          setSelectedAreaPosition(null);
          
          // Exit selection mode
          setIsAreaSelectionMode(false);
          
          // Cleanup
          if (selectionBoxRef.current) {
            selectionBoxRef.current.style.display = 'none';
          }
          
          toast({
            title: "Image Area Selected",
            description: "Analyzing the selected area...",
          });
        }
      } catch (error) {
        console.error("Error capturing selection area:", error);
        toast({
          title: "Selection Failed",
          description: "Could not capture the selected area. Please try again.",
          variant: "destructive"
        });
      }
    };

    // Improved area selection mouse handlers
    const handleAreaSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode || e.button !== 0) return;
      
      // Get the correct container element
      const viewport = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;
      
      const rect = viewport.getBoundingClientRect();
      const scrollTop = viewport.scrollTop || 0;
      
      // Store selection start coordinates relative to the viewport
      setSelectionStart({
        x: e.clientX - rect.left,
        y: (e.clientY - rect.top) + scrollTop
      });
      setIsSelecting(true);
      
      // Initialize selection box
      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.display = 'block';
        selectionBoxRef.current.style.left = `${e.clientX - rect.left}px`;
        selectionBoxRef.current.style.top = `${e.clientY - rect.top + scrollTop}px`;
        selectionBoxRef.current.style.width = '0px';
        selectionBoxRef.current.style.height = '0px';
      }
    };
    
    const handleAreaSelectionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode || !isSelecting || !selectionStart) return;
      
      // Get the correct container element
      const viewport = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;
      
      const rect = viewport.getBoundingClientRect();
      const scrollTop = viewport.scrollTop || 0;
      
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top + scrollTop;
      
      setSelectionEnd({
        x: currentX,
        y: currentY
      });
      
      // Update selection box
      if (selectionBoxRef.current) {
        const left = Math.min(selectionStart.x, currentX);
        const top = Math.min(selectionStart.y, currentY);
        const width = Math.abs(selectionStart.x - currentX);
        const height = Math.abs(selectionStart.y - currentY);
        
        selectionBoxRef.current.style.left = `${left}px`;
        selectionBoxRef.current.style.top = `${top}px`;
        selectionBoxRef.current.style.width = `${width}px`;
        selectionBoxRef.current.style.height = `${height}px`;
      }
    };
    
    const handleAreaSelectionMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAreaSelectionMode || !isSelecting || !selectionStart) return;
      
      // Get the correct container element
      const viewport = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;
      
      const rect = viewport.getBoundingClientRect();
      const scrollTop = viewport.scrollTop || 0;
      
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top + scrollTop;
      
      setSelectionEnd({
        x: currentX,
        y: currentY
      });
      
      setIsSelecting(false);
      
      // Check if the selection has a reasonable size
      if (Math.abs(selectionStart.x - currentX) > 10 && Math.abs(selectionStart.y - currentY) > 10) {
        // Position explain tooltip near the selection
        const tooltipX = (selectionStart.x + currentX) / 2;
        const tooltipY = Math.min(selectionStart.y, currentY) - 10;
        
        setSelectedAreaPosition({
          x: tooltipX,
          y: tooltipY
        });
        
        setShowImageExplainTooltip(true);
      } else {
        // Selection too small, reset
        toast({
          title: "Selection Too Small",
          description: "Please select a larger area to explain.",
          variant: "destructive"
        });
        
        if (selectionBoxRef.current) {
          selectionBoxRef.current.style.display = 'none';
        }
        setSelectionStart(null);
        setSelectionEnd(null);
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

    // Updated toggle area selection mode with better feedback
    const toggleAreaSelectionMode = () => {
      const newMode = !isAreaSelectionMode;
      setIsAreaSelectionMode(newMode);
      
      // Reset selection state when toggling
      if (!newMode && selectionBoxRef.current) {
        selectionBoxRef.current.style.display = 'none';
      }
      
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsSelecting(false);
      setShowImageExplainTooltip(false);
      
      // Only show toast when enabling
      if (newMode) {
        toast({
          title: "Area Selection Mode Enabled",
          description: "Click and drag anywhere on the PDF to select an area to explain",
        });
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
        {/* PDF Toolbar */}
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
          
          {/* Area Selection Toggle Button */}
          <Button 
            variant={isAreaSelectionMode ? "secondary" : "ghost"}
            size="icon" 
            className={`h-7 w-7 ${isAreaSelectionMode ? 'bg-blue-100' : 'text-black'}`}
            onClick={toggleAreaSelectionMode}
            title={isAreaSelectionMode ? "Exit Area Selection Mode" : "Enter Area Selection Mode"}
          >
            <Crop className="h-3.5 w-3.5" />
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
          
          {/* Selected Mode Indicator */}
          {isAreaSelectionMode && (
            <div className="text-xs font-medium text-blue-600 ml-auto mr-2 flex items-center gap-1">
              <Crop className="h-3 w-3" />
              <span>Area Selection Mode</span>
            </div>
          )}
        </div>

        {/* PDF Content with full width */}
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
