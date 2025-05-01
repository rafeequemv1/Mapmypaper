
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { ZoomIn, ZoomOut, RotateCw, Search, Crop } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getPdfData, getCurrentPdf } from "@/utils/pdfStorage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { fabric } from "fabric";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import html2canvas from 'html2canvas';

// Set up the worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: () => React.ReactNode;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onImageCaptured, onPdfLoaded, renderTooltipContent }, ref) => {
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
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
    const [showTextTooltip, setShowTextTooltip] = useState(false);
    const textTooltipRef = useRef<HTMLDivElement>(null);
    const selectionTimeout = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Area selection mode state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionCanvas, setSelectionCanvas] = useState<fabric.Canvas | null>(null);
    const [currentSelectionRect, setCurrentSelectionRect] = useState<fabric.Rect | null>(null);
    const [showAreaTooltip, setShowAreaTooltip] = useState(false);
    const [areaTooltipPosition, setAreaTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const selectionRectRef = useRef<fabric.Rect | null>(null);
    const activePdfPageRef = useRef<number | null>(null);

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
        const event = new CustomEvent('openChatWithText', {
          detail: { text: selectedText }
        });
        window.dispatchEvent(event);
        
        setShowTextTooltip(false);
      }
    };

    // Selection Mode Canvas Setup and Cleanup
    useEffect(() => {
      let canvasInstance: fabric.Canvas | null = null;
      
      if (isSelectionMode && pdfContainerRef.current) {
        // Create a container for the fabric canvas that covers the entire PDF viewer
        if (!canvasContainerRef.current) {
          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.pointerEvents = 'all';
          container.style.zIndex = '10';
          
          const canvas = document.createElement('canvas');
          canvas.id = 'selection-canvas';
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          
          container.appendChild(canvas);
          
          // Make sure we get the viewport element
          const viewport = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.appendChild(container);
            canvasContainerRef.current = container;
            selectionCanvasRef.current = canvas;
          }
        }
        
        // Initialize the fabric canvas only if we have valid references
        const viewport = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport && selectionCanvasRef.current) {
          const viewportRect = viewport.getBoundingClientRect();
          
          // Set canvas dimensions explicitly to match viewport
          selectionCanvasRef.current.width = viewport.scrollWidth;
          selectionCanvasRef.current.height = viewport.scrollHeight;
          
          // Create new fabric canvas instance
          canvasInstance = new fabric.Canvas(selectionCanvasRef.current, {
            width: viewport.scrollWidth,
            height: viewport.scrollHeight,
            selection: false,
            includeDefaultValues: false,
          });
          
          // Set cursor style
          canvasInstance.defaultCursor = 'crosshair';
          
          // Store the canvas instance
          setSelectionCanvas(canvasInstance);
          
          let startPoint = { x: 0, y: 0 };
          let isDrawing = false; // Add this to track drawing state
          
          // Add selection rectangle creation on mouse down
          canvasInstance.on('mouse:down', (options) => {
            isDrawing = true; // Set drawing state to true
            
            // Clear any existing rectangle
            if (selectionRectRef.current) {
              canvasInstance?.remove(selectionRectRef.current);
              selectionRectRef.current = null;
            }
            
            // Store start point
            startPoint = canvasInstance!.getPointer(options.e);
            
            // Create a new rectangle
            const rect = new fabric.Rect({
              left: startPoint.x,
              top: startPoint.y,
              width: 0,
              height: 0,
              fill: 'rgba(0, 123, 255, 0.2)',
              stroke: 'rgba(0, 123, 255, 0.8)',
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            });
            
            // Add the rectangle to the canvas
            canvasInstance?.add(rect);
            
            // Store the rectangle
            selectionRectRef.current = rect;
            setCurrentSelectionRect(rect);
            
            // Determine which page is being selected
            const pagesElements = document.querySelectorAll('[data-page-number]');
            let activePage = 1; // Default to first page
            
            for (let i = 0; i < pagesElements.length; i++) {
              const pageElement = pagesElements[i] as HTMLElement;
              const pageRect = pageElement.getBoundingClientRect();
              const mouseY = options.e.clientY;
              
              if (mouseY >= pageRect.top && mouseY <= pageRect.bottom) {
                activePage = parseInt(pageElement.dataset.pageNumber || '1', 10);
                break;
              }
            }
            
            activePdfPageRef.current = activePage;
          });
          
          // Update rectangle dimensions on mouse move
          canvasInstance.on('mouse:move', (options) => {
            if (!isDrawing || !selectionRectRef.current || !canvasInstance) return;
            
            const currentPoint = canvasInstance.getPointer(options.e);
            const rect = selectionRectRef.current;
            
            // Calculate width and height based on start point and current point
            const width = Math.abs(currentPoint.x - startPoint.x);
            const height = Math.abs(currentPoint.y - startPoint.y);
            
            // Set position based on direction of drag
            if (currentPoint.x < startPoint.x) {
              rect.set('left', currentPoint.x);
            } else {
              rect.set('left', startPoint.x);
            }
            
            if (currentPoint.y < startPoint.y) {
              rect.set('top', currentPoint.y);
            } else {
              rect.set('top', startPoint.y);
            }
            
            // Update dimensions
            rect.set('width', width);
            rect.set('height', height);
            
            // Re-render canvas
            canvasInstance.renderAll();
          });
          
          // Finalize selection on mouse up
          canvasInstance.on('mouse:up', (options) => {
            if (!isDrawing || !selectionRectRef.current || !canvasInstance) return;
            
            isDrawing = false; // Reset drawing state
            
            const rect = selectionRectRef.current;
            
            // Make sure the rectangle is rendered one last time
            canvasInstance.renderAll();
            
            // Check if selection has minimum size
            if (rect.width! > 10 && rect.height! > 10) {
              // Get position for tooltip
              setAreaTooltipPosition({
                x: rect.left! + rect.width! / 2,
                y: rect.top!
              });
              
              // Show tooltip
              setShowAreaTooltip(true);
            } else {
              // Remove tiny selections
              canvasInstance.remove(rect);
              selectionRectRef.current = null;
              setCurrentSelectionRect(null);
            }
          });
          
          // Add global mouse up handler to finish drawing even if mouse up occurs outside canvas
          const handleGlobalMouseUp = () => {
            if (isDrawing && selectionRectRef.current && canvasInstance) {
              isDrawing = false;
              
              const rect = selectionRectRef.current;
              
              // Make sure the rectangle is rendered one last time
              canvasInstance.renderAll();
              
              // Check if selection has minimum size
              if (rect.width! > 10 && rect.height! > 10) {
                // Get position for tooltip
                setAreaTooltipPosition({
                  x: rect.left! + rect.width! / 2,
                  y: rect.top!
                });
                
                // Show tooltip
                setShowAreaTooltip(true);
              } else {
                // Remove tiny selections
                canvasInstance.remove(rect);
                selectionRectRef.current = null;
                setCurrentSelectionRect(null);
              }
            }
          };
          
          // Add global mouse up listener
          document.addEventListener('mouseup', handleGlobalMouseUp);
          
          // Clean up global mouse up listener
          return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            
            if (canvasInstance) {
              canvasInstance.dispose();
              setSelectionCanvas(null);
            }
            
            if (!isSelectionMode) {
              // Remove the canvas container
              if (canvasContainerRef.current) {
                canvasContainerRef.current.remove();
                canvasContainerRef.current = null;
                selectionCanvasRef.current = null;
              }
              
              // Clear selection state
              setCurrentSelectionRect(null);
              selectionRectRef.current = null;
              setShowAreaTooltip(false);
            }
          };
        }
      }
      
      // Cleanup when unmounting or when selection mode is turned off
      return () => {
        if (canvasInstance) {
          canvasInstance.dispose();
          setSelectionCanvas(null);
        }
        
        if (!isSelectionMode) {
          // Remove the canvas container
          if (canvasContainerRef.current) {
            canvasContainerRef.current.remove();
            canvasContainerRef.current = null;
            selectionCanvasRef.current = null;
          }
          
          // Clear selection state
          setCurrentSelectionRect(null);
          selectionRectRef.current = null;
          setShowAreaTooltip(false);
        }
      };
    }, [isSelectionMode]);

    // Function to capture the selected area as image
    const captureSelectedArea = () => {
      if (!selectionRectRef.current || !selectionCanvas) return;
      
      try {
        // Get the coordinates of the selection rectangle
        const rect = selectionRectRef.current;
        
        // Create a temporary canvas to crop the area
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        if (!ctx) {
          console.error('Could not get 2D context for canvas');
          return;
        }
        
        // Set the temp canvas dimensions to the selection dimensions
        tempCanvas.width = Math.round(rect.width as number);
        tempCanvas.height = Math.round(rect.height as number);
        
        // Find the PDF page that contains our selection
        const pdfPages = document.querySelectorAll('[data-page-number]');
        const pageNum = activePdfPageRef.current || 1;
        let targetPage: Element | null = null;
        
        for (let i = 0; i < pdfPages.length; i++) {
          if ((pdfPages[i] as HTMLElement).dataset.pageNumber === String(pageNum)) {
            targetPage = pdfPages[i];
            break;
          }
        }
        
        if (!targetPage) {
          console.error('Could not find target page element');
          return;
        }
        
        // Calculate the offset of the PDF page relative to the viewport
        const pageRect = targetPage.getBoundingClientRect();
        const scrollContainer = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        const scrollTop = scrollContainer?.scrollTop || 0;
        const scrollLeft = scrollContainer?.scrollLeft || 0;
        
        console.log('Capturing area:', {
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          },
          page: {
            top: pageRect.top,
            left: pageRect.left
          },
          scroll: {
            top: scrollTop,
            left: scrollLeft
          }
        });
        
        // Convert page element to image
        html2canvas(targetPage as HTMLElement, {
          backgroundColor: null,
          scale: window.devicePixelRatio, // Use device pixel ratio for better quality
          useCORS: true,
          logging: true, // Enable logging for debugging
        }).then(pageCanvas => {
          // Calculate the offset within the page
          const canvasOffset = {
            x: Math.round(rect.left! - (pageRect.left - (scrollContainer?.getBoundingClientRect().left || 0)) + scrollLeft),
            y: Math.round(rect.top! - (pageRect.top - scrollTop))
          };
          
          console.log('Canvas offset:', canvasOffset);
          
          // Draw only the selected portion to our temp canvas
          ctx.drawImage(
            pageCanvas, 
            canvasOffset.x * window.devicePixelRatio, 
            canvasOffset.y * window.devicePixelRatio, 
            rect.width! * window.devicePixelRatio, 
            rect.height! * window.devicePixelRatio,
            0, 
            0, 
            rect.width as number, 
            rect.height as number
          );
          
          // Convert to data URL
          const imageData = tempCanvas.toDataURL('image/png');
          
          // Store the captured image
          setCapturedImage(imageData);
          
          // Send the captured image to parent component
          if (onImageCaptured) {
            onImageCaptured(imageData);
          }
          
          // Dispatch a custom event to open the chat with the image
          const event = new CustomEvent('openChatWithImage', {
            detail: { imageData }
          });
          window.dispatchEvent(event);
          
          // Hide tooltip and exit selection mode
          setShowAreaTooltip(false);
          setIsSelectionMode(false);
          
          toast({
            title: "Area captured",
            description: "The selected area has been sent to the chat.",
          });
        }).catch(err => {
          console.error('Error capturing PDF area:', err);
          toast({
            title: "Capture failed",
            description: "Failed to capture the selected area.",
            variant: "destructive"
          });
        });
      } catch (error) {
        console.error('Error capturing selected area:', error);
        toast({
          title: "Capture failed",
          description: "An error occurred while capturing the selected area.",
          variant: "destructive"
        });
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
      setLoadError(null);
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

    // Toggle selection mode
    const toggleSelectionMode = () => {
      setIsSelectionMode(!isSelectionMode);
      
      if (isSelectionMode) {
        // Turn off selection mode
        setCurrentSelectionRect(null);
        setShowAreaTooltip(false);
      } else {
        // Turn on selection mode
        toast({
          title: "Selection mode activated",
          description: "Click and drag to select an area of the PDF.",
        });
      }
    };
    
    // Render text selection tooltip
    const renderTextSelectionTooltip = () => {
      if (!showTextTooltip || !selectionPosition) return null;
      
      return (
        <div
          ref={tooltipRef}
          className="absolute bg-white rounded-md shadow-lg border border-gray-200 z-50 p-2"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y - 40}px`,
            transform: 'translate(-50%, 0)'
          }}
        >
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
            onClick={handleExplainText}
          >
            Explain This Text
          </button>
        </div>
      );
    };
    
    // Render area selection tooltip
    const renderAreaSelectionTooltip = () => {
      if (!showAreaTooltip || !areaTooltipPosition) return null;
      
      return (
        <div
          className="absolute bg-white rounded-md shadow-lg border border-gray-200 z-50 p-2"
          style={{
            left: `${areaTooltipPosition.x}px`,
            top: `${areaTooltipPosition.y - 40}px`,
            transform: 'translate(-50%, 0)'
          }}
        >
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
            onClick={captureSelectedArea}
          >
            Capture This Area
          </button>
        </div>
      );
    };

    // PDF Toolbar (make even more compact)
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
                <span className="text-xs">Search</span>
              </Button>
            </div>
          </div>
          
          {/* Area Selection Button */}
          <Button 
            variant={isSelectionMode ? "secondary" : "ghost"}
            size="sm" 
            className={`h-6 px-1 text-black flex items-center gap-0.5 ${isSelectionMode ? 'bg-gray-200' : ''}`}
            onClick={toggleSelectionMode}
            title="Select Area"
          >
            <Crop className="h-3 w-3" />
            <span className="text-xs">Select</span>
          </Button>
          
          {/* Previous/Next Result Navigation */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1"
                onClick={() => navigateSearch('prev')}
                title="Previous Result"
              >
                <span className="text-xs">Prev</span>
              </Button>
              <span className="text-xs">
                {currentSearchIndex + 1}/{searchResults.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1"
                onClick={() => navigateSearch('next')}
                title="Next Result"
              >
                <span className="text-xs">Next</span>
              </Button>
            </div>
          )}
        </div>
        
        {/* PDF Content with Selection and Search Tooltips */}
        <ScrollArea className="flex-1 relative" ref={pdfContainerRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-500">Loading PDF...</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4 max-w-md">
                <div className="bg-red-100 text-red-700 p-3 rounded-md mb-2">
                  <p className="font-medium">{loadError}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Document
                file={pdfData || ''}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-red-100 text-red-700 p-3 rounded-md">
                      <p>Failed to load PDF document.</p>
                    </div>
                  </div>
                }
                className="flex flex-col items-center"
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div 
                    key={`page_${index + 1}`}
                    ref={setPageRef(index)}
                    className="mb-2 shadow-md relative"
                    data-page-number={index + 1}
                  >
                    <Page
                      pageNumber={index + 1}
                      scale={scale}
                      width={getOptimalPageWidth()}
                      onRenderSuccess={onPageRenderSuccess}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg"
                    />
                    <div className="absolute bottom-1 right-1 bg-gray-200 bg-opacity-75 rounded px-1 text-xs">
                      {index + 1} / {numPages}
                    </div>
                  </div>
                ))}
              </Document>
            </>
          )}
          {renderTextSelectionTooltip()}
          {renderAreaSelectionTooltip()}
        </ScrollArea>
      </div>
    );
  }
);

export default PdfViewer;
