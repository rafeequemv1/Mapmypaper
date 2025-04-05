import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, RefreshCw, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useRef as useStateRef } from "react";
import { retrievePDF } from "@/utils/pdfStorage";
import { fabric } from "fabric";
import { captureSelectedArea } from "@/utils/captureScreenshot";

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
    const [isSelectingArea, setIsSelectingArea] = useState(false);
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const selectionRef = useRef<fabric.Rect | null>(null);
    const captureAreaRef = useRef<HTMLDivElement | null>(null);
    const [showCaptureTooltip, setShowCaptureTooltip] = useState(false);
    const [captureTooltipPosition, setCaptureTooltipPosition] = useState<{x: number, y: number} | null>(null);
    const [isDrawingSelection, setIsDrawingSelection] = useState(false);
    const selectionStartPoint = useRef<{x: number, y: number} | null>(null);
    
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

    // Initialize fabric.js canvas for area selection
    const initSelectCanvas = () => {
      // Clean up existing canvas
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
      
      if (!captureAreaRef.current) return;
      
      // Calculate dimensions
      const containerElement = captureAreaRef.current;
      const containerRect = containerElement.getBoundingClientRect();
      
      // Create a canvas element
      const canvasElement = document.createElement('canvas');
      canvasElement.width = containerRect.width;
      canvasElement.height = containerRect.height;
      canvasElement.className = 'selection-canvas';
      canvasElement.style.position = 'absolute';
      canvasElement.style.top = '0';
      canvasElement.style.left = '0';
      canvasElement.style.pointerEvents = 'none';
      canvasElement.style.zIndex = '100';
      
      // Add the canvas to the container
      containerElement.style.position = 'relative';
      containerElement.appendChild(canvasElement);
      
      // Initialize fabric canvas
      const canvas = new fabric.Canvas(canvasElement, {
        selection: false,
        renderOnAddRemove: true
      });
      
      canvasRef.current = canvas;
      
      // Add event listeners for mouse interactions to enable click and drag
      containerElement.addEventListener('mousedown', handleMouseDown);
      containerElement.addEventListener('mousemove', handleMouseMove);
      containerElement.addEventListener('mouseup', handleMouseUp);
      
      // Add window resize handler to adjust canvas size
      const handleResize = () => {
        if (canvasRef.current) {
          const rect = containerElement.getBoundingClientRect();
          canvasRef.current.setWidth(rect.width);
          canvasRef.current.setHeight(rect.height);
          canvasRef.current.renderAll();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        containerElement.removeEventListener('mousedown', handleMouseDown);
        containerElement.removeEventListener('mousemove', handleMouseMove);
        containerElement.removeEventListener('mouseup', handleMouseUp);
        if (canvasRef.current) {
          canvasRef.current.dispose();
          canvasElement.remove();
        }
      };
    };

    // Mouse down handler - start drawing rectangle
    const handleMouseDown = (e: MouseEvent) => {
      if (!isSelectingArea || !canvasRef.current) return;
      
      // Prevent the default behavior
      e.preventDefault();
      
      // Remove any existing selection rectangle
      if (selectionRef.current) {
        canvasRef.current.remove(selectionRef.current);
        selectionRef.current = null;
      }
      
      // Hide capture tooltip if visible
      setShowCaptureTooltip(false);
      
      // Get the mouse position relative to the canvas container
      const containerRect = captureAreaRef.current!.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      // Store the starting point
      selectionStartPoint.current = { x, y };
      
      // Create a new rectangle at the starting point
      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: 0,
        height: 0,
        fill: 'rgba(66, 153, 225, 0.3)',
        stroke: '#3182CE',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false
      });
      
      selectionRef.current = rect;
      canvasRef.current.add(rect);
      
      // Set drawing state to true
      setIsDrawingSelection(true);
    };

    // Mouse move handler - update rectangle size
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectingArea || !isDrawingSelection || !canvasRef.current || !selectionRef.current || !selectionStartPoint.current) return;
      
      // Get the current mouse position
      const containerRect = captureAreaRef.current!.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;
      
      // Calculate width and height
      const width = Math.abs(x - selectionStartPoint.current.x);
      const height = Math.abs(y - selectionStartPoint.current.y);
      
      // Calculate top-left position (handle dragging in any direction)
      const left = Math.min(x, selectionStartPoint.current.x);
      const top = Math.min(y, selectionStartPoint.current.y);
      
      // Update the rectangle
      selectionRef.current.set({
        left,
        top,
        width,
        height
      });
      
      canvasRef.current.renderAll();
    };

    // Mouse up handler - finish drawing rectangle
    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelectingArea || !isDrawingSelection || !canvasRef.current || !selectionRef.current) return;
      
      // Set drawing state to false
      setIsDrawingSelection(false);
      
      // Make sure we have a valid selection (not just a click)
      const minSize = 10; // Minimum size in pixels to be considered a valid selection
      
      if (selectionRef.current.width! < minSize || selectionRef.current.height! < minSize) {
        // Invalid selection, remove it
        canvasRef.current.remove(selectionRef.current);
        selectionRef.current = null;
        return;
      }
      
      // Make the rectangle selectable and modifiable
      selectionRef.current.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        transparentCorners: false,
        cornerColor: '#3182CE',
        cornerStyle: 'circle',
        cornerSize: 6
      });
      
      canvasRef.current.setActiveObject(selectionRef.current);
      canvasRef.current.renderAll();
      
      // Show the capture tooltip
      const rect = selectionRef.current;
      setCaptureTooltipPosition({
        x: rect.left! + rect.width! / 2,
        y: rect.top! - 10,
      });
      setShowCaptureTooltip(true);
    };

    // Start area selection
    const startAreaSelection = () => {
      if (isSelectingArea) {
        // Toggle off if already selecting
        endAreaSelection();
        return;
      }
      
      setIsSelectingArea(true);
      
      // Initialize canvas if not already done
      const cleanup = initSelectCanvas();
      
      toast({
        title: "Area Selection Mode",
        description: "Click and drag to select an area, then click 'Capture & Explain'",
      });
      
      return cleanup;
    };

    // End area selection
    const endAreaSelection = () => {
      setIsSelectingArea(false);
      setShowCaptureTooltip(false);
      
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
      
      if (captureAreaRef.current) {
        const canvasElement = captureAreaRef.current.querySelector('.selection-canvas');
        if (canvasElement) {
          canvasElement.remove();
        }
        
        // Remove event listeners
        captureAreaRef.current.removeEventListener('mousedown', handleMouseDown);
        captureAreaRef.current.removeEventListener('mousemove', handleMouseMove);
        captureAreaRef.current.removeEventListener('mouseup', handleMouseUp);
      }
      
      selectionRef.current = null;
      selectionStartPoint.current = null;
      setIsDrawingSelection(false);
    };

    // Capture the selected area
    const captureSelectedAreaAndExplain = async () => {
      if (!captureAreaRef.current || !selectionRef.current || !canvasRef.current) {
        toast({
          title: "Selection Error",
          description: "Please try selecting an area again",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const canvas = canvasRef.current;
        const rect = selectionRef.current;
        
        // Get the rectangle coordinates
        const left = rect.left!;
        const top = rect.top!;
        const width = rect.width! * rect.scaleX!;
        const height = rect.height! * rect.scaleY!;
        
        // Capture the screenshot
        const imageData = await captureSelectedArea(captureAreaRef.current, {
          left, top, width, height
        });
        
        // Pass the image data to the callback
        if (onImageSelectedRef.current) {
          onImageSelectedRef.current(imageData);
          
          toast({
            title: "Image Captured",
            description: "Area has been sent to the chat for explanation",
          });
        }
        
        // End selection mode
        endAreaSelection();
      } catch (error) {
        console.error("Error capturing selected area:", error);
        toast({
          title: "Screenshot Error",
          description: "Failed to capture the selected area",
          variant: "destructive",
        });
      }
    };

    // Handle text selection
    const handleDocumentMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelectingArea) return; // Don't handle text selection while in area selection mode
      
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
      };
      
      document.addEventListener('mousedown', handleDocumentClick);
      
      return () => {
        document.removeEventListener('mousedown', handleDocumentClick);
      };
    }, [showExplainTooltip, selectionPosition]);
    
    // Function to handle explain button click for text
    const handleExplain = () => {
      if (selectedText && onTextSelectedRef.current) {
        onTextSelectedRef.current(selectedText);
        setShowExplainTooltip(false);
        setSelectionPosition(null);
      }
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (canvasRef.current) {
          canvasRef.current.dispose();
          canvasRef.current = null;
        }
      };
    }, []);

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
          
          {/* Screenshot Button */}
          <Button 
            variant={isSelectingArea ? "default" : "ghost"} 
            size="icon" 
            className={`h-7 w-7 ${isSelectingArea ? "bg-blue-500 text-white" : "text-black"}`} 
            onClick={startAreaSelection}
            title={isSelectingArea ? "Cancel Area Selection" : "Select Area for Screenshot"}
            disabled={isLoading || !pdfData}
          >
            <Camera className="h-3.5 w-3.5" />
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
        
        {/* PDF Viewer */}
        <ScrollArea 
          className="flex-1 w-full h-full bg-gray-100"
          ref={pdfContainerRef}
        >
          <div className="px-2 py-4">
            {isLoading && (
              <div className="flex flex-col items-center mt-12">
                <Skeleton className="h-96 w-[90%] bg-gray-200" />
                <p className="mt-4 text-gray-500">Loading PDF...</p>
              </div>
            )}
            
            {loadError && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-red-50 text-red-800 p-6 rounded-lg max-w-md">
                  <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
                  <p>{loadError}</p>
                  <Button 
                    variant="outline"
                    className="mt-4"
                    onClick={refreshPdfData}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {pdfData && !isLoading && (
              <div 
                className="flex flex-col items-center relative" 
                onMouseUp={handleDocumentMouseUp}
                ref={captureAreaRef}
              >
                <Document
                  file={pdfData}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center mt-12">
                      <Skeleton className="h-96 w-[90%] bg-gray-200" />
                      <p className="mt-4 text-gray-500">Loading PDF...</p>
                    </div>
                  }
                  className="pdf-document"
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} ref={setPageRef(index)} className="mb-8 flex justify-center pdf-page-container">
                      <Page
                        pageNumber={index + 1}
                        width={getOptimalPageWidth()}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="pdf-page"
                        onRenderSuccess={onPageRenderSuccess}
                        loading={
                          <Skeleton className="h-96 w-full bg
