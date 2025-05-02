
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
    const isDrawingRef = useRef<boolean>(false); // Add ref to track drawing state

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

    useEffect(() => {
      if (isSelectionMode && pdfContainerRef.current && !selectionCanvas) {
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
          pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]')?.appendChild(container);
          
          canvasContainerRef.current = container;
          selectionCanvasRef.current = canvas;
        }
        
        // Initialize the fabric canvas
        const viewport = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport && selectionCanvasRef.current) {
          const viewportRect = viewport.getBoundingClientRect();
          
          const canvas = new fabric.Canvas(selectionCanvasRef.current, {
            width: viewport.scrollWidth,
            height: viewport.scrollHeight,
            selection: false,
            includeDefaultValues: false,
          });
          
          // Set cursor style
          canvas.defaultCursor = 'crosshair';
          
          // Store the canvas instance
          setSelectionCanvas(canvas);
          
          // Add selection rectangle creation on mouse down
          canvas.on('mouse:down', (options) => {
            // Set drawing flag to true
            isDrawingRef.current = true;
            
            // Clear any existing rectangle
            if (selectionRectRef.current) {
              canvas.remove(selectionRectRef.current);
              selectionRectRef.current = null;
            }
            
            // Get the pointer coordinates
            const pointer = canvas.getPointer(options.e);
            
            // Create a new rectangle
            const rect = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
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
            canvas.add(rect);
            canvas.renderAll();
            
            // Store the rectangle
            selectionRectRef.current = rect;
            setCurrentSelectionRect(rect);
            
            // Determine which page is being selected
            const pagesElements = document.querySelectorAll('[data-page-number]');
            let activePage = null;
            
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
          canvas.on('mouse:move', (options) => {
            // Only update if we're drawing
            if (!isDrawingRef.current || !selectionRectRef.current) return;
            
            const pointer = canvas.getPointer(options.e);
            const rect = selectionRectRef.current;
            
            // Update width based on current pointer position
            if (pointer.x > rect.left!) {
              rect.set('width', pointer.x - rect.left!);
            } else {
              rect.set('left', pointer.x);
              rect.set('width', rect.left! - pointer.x);
            }
            
            // Update height based on current pointer position
            if (pointer.y > rect.top!) {
              rect.set('height', pointer.y - rect.top!);
            } else {
              rect.set('top', pointer.y);
              rect.set('height', rect.top! - pointer.y);
            }
            
            canvas.renderAll();
          });
          
          // Finalize selection on mouse up
          canvas.on('mouse:up', (options) => {
            // Stop drawing
            isDrawingRef.current = false;
            
            if (!selectionRectRef.current) return;
            
            const rect = selectionRectRef.current;
            
            // Check if selection has width and height
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
              canvas.remove(rect);
              selectionRectRef.current = null;
              setCurrentSelectionRect(null);
            }
            
            canvas.renderAll();
          });
          
          // Add a global mouse up handler to ensure rectangle drawing stops
          // even if mouseup happens outside the canvas
          const handleGlobalMouseUp = () => {
            if (isDrawingRef.current && selectionCanvas) {
              isDrawingRef.current = false;
              selectionCanvas.renderAll();
            }
          };
          
          document.addEventListener('mouseup', handleGlobalMouseUp);
          
          // Cleanup function will remove this event listener
          return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
          };
        }
      }
      
      // Cleanup when selection mode is turned off
      return () => {
        if (!isSelectionMode && selectionCanvas) {
          // Reset drawing flag
          isDrawingRef.current = false;
          
          // Dispose canvas
          selectionCanvas.dispose();
          setSelectionCanvas(null);
          
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
          
          // Ensure cursor is reset
          const pdfContainer = document.querySelector('[data-pdf-viewer]');
          if (pdfContainer instanceof HTMLElement) {
            pdfContainer.style.cursor = 'default';
          }
        }
      };
    }, [isSelectionMode, pdfContainerRef.current]);

    // Update this function to fix black images issue
    const captureSelectedArea = () => {
      if (!selectionRectRef.current || !selectionCanvas) return;
      
      try {
        // Get the coordinates of the selection rectangle
        const rect = selectionRectRef.current;
        
        // Find the PDF page that contains our selection
        const pdfPages = document.querySelectorAll('[data-page-number]');
        const pageNum = activePdfPageRef.current || 1;
        let targetPage = null;
        
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
        
        // Get all necessary measurements
        const pageRect = targetPage.getBoundingClientRect();
        const scrollContainer = pdfContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        const scrollTop = scrollContainer?.scrollTop || 0;
        const scrollLeft = scrollContainer?.scrollLeft || 0;
        const viewportRect = scrollContainer?.getBoundingClientRect() || { left: 0, top: 0 };
        
        // Use improved html2canvas options for better rendering
        const htmlCanvasOptions = {
          backgroundColor: null,
          scale: window.devicePixelRatio || 1,
          useCORS: true,
          allowTaint: true,
          scrollX: -scrollLeft,
          scrollY: -scrollTop,
          logging: false, // Reduce logging noise
          onclone: (clonedDoc: Document) => {
            // Fix styles in cloned document for better rendering
            const clonedPage = clonedDoc.querySelector(`[data-page-number="${pageNum}"]`);
            if (clonedPage) {
              // Ensure text is visible in captured image
              const textLayers = clonedPage.querySelectorAll('.react-pdf__Page__textContent');
              textLayers.forEach((layer) => {
                if (layer instanceof HTMLElement) {
                  layer.style.transform = 'none';
                  layer.style.opacity = '1';
                  layer.style.display = 'block';
                }
              });
            }
            return clonedDoc;
          },
        };
        
        // First attempt with white background to avoid black images
        html2canvas(targetPage as HTMLElement, {
          ...htmlCanvasOptions,
          backgroundColor: '#ffffff', // Set white background explicitly
        }).then((pageCanvas) => {
          // Calculate the correct position on the page
          const rectLeft = Math.min(rect.left!, rect.left! + rect.width!);
          const rectTop = Math.min(rect.top!, rect.top! + rect.height!);
          
          // Calculate exact position where to start copying from the source image
          const sourceX = (rectLeft - (pageRect.left - viewportRect.left) + scrollLeft) * window.devicePixelRatio;
          const sourceY = (rectTop - (pageRect.top - viewportRect.top) + scrollTop) * window.devicePixelRatio;
          
          // Create a temporary canvas to crop the area
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          
          if (!ctx) {
            console.error('Could not get 2D context for canvas');
            return;
          }
          
          // Set the temp canvas dimensions to the selection dimensions
          const captureWidth = Math.abs(rect.width!);
          const captureHeight = Math.abs(rect.height!);
          tempCanvas.width = captureWidth;
          tempCanvas.height = captureHeight;
          
          // Fill with white background first (prevents transparency issues)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, captureWidth, captureHeight);
          
          try {
            // Draw the selected portion to our temp canvas
            ctx.drawImage(
              pageCanvas, 
              sourceX, 
              sourceY, 
              captureWidth * window.devicePixelRatio, 
              captureHeight * window.devicePixelRatio,
              0, 
              0, 
              captureWidth, 
              captureHeight
            );
            
            // Convert to data URL with JPEG format (more compatible, no transparency issues)
            const imageData = tempCanvas.toDataURL('image/jpeg', 0.95);
            
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
          } catch (drawError) {
            console.error('Error drawing the image section:', drawError);
            
            // Fallback method - capture entire page and crop in JavaScript
            try {
              // Create a new image from the pageCanvas
              const img = new Image();
              img.onload = function() {
                // Fill with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, captureWidth, captureHeight);
                
                // Draw the cropped portion
                ctx.drawImage(
                  img, 
                  sourceX / window.devicePixelRatio, 
                  sourceY / window.devicePixelRatio, 
                  captureWidth, 
                  captureHeight, 
                  0, 
                  0, 
                  captureWidth, 
                  captureHeight
                );
                
                // Convert to JPEG data URL
                const imageData = tempCanvas.toDataURL('image/jpeg', 0.95);
                
                // Store and send the image
                setCapturedImage(imageData);
                if (onImageCaptured) {
                  onImageCaptured(imageData);
                }
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('openChatWithImage', {
                  detail: { imageData }
                }));
                
                setShowAreaTooltip(false);
                setIsSelectionMode(false);
                
                toast({
                  title: "Area captured (fallback method)",
                  description: "The selected area has been sent to the chat.",
                });
              };
              img.src = pageCanvas.toDataURL('image/jpeg', 0.95);
            } catch (fallbackError) {
              console.error('Fallback capture method failed:', fallbackError);
              toast({
                title: "Capture failed",
                description: "Could not capture the selected area.",
                variant: "destructive"
              });
            }
          }
        }).catch((err) => {
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
      
      if (isSelectionMode) {
        // Turn off selection mode
        setCurrentSelectionRect(null);
        setShowAreaTooltip(false);
        isDrawingRef.current = false; // Ensure drawing state is reset
        
        // Reset cursor on the PDF container
        const pdfContainer = document.querySelector('[data-pdf-viewer]');
        if (pdfContainer instanceof HTMLElement) {
          pdfContainer.style.cursor = 'default';
        }
      } else {
        // Turn on selection mode
        toast({
          title: "Selection mode activated",
          description: "Click and drag to select an area of the PDF.",
        });
      }
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

    // Add area tooltip component
    const AreaSelectionTooltip = () => {
      if (!showAreaTooltip || !areaTooltipPosition) return null;
      
      return (
        <div
          className="absolute bg-white shadow-lg rounded-lg p-2 z-50"
          style={{
            left: `${areaTooltipPosition.x}px`,
            top: `${areaTooltipPosition.y - 40}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <button
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            onClick={captureSelectedArea}
          >
            Capture Area
          </button>
        </div>
      );
    };
    
    return (
      <div className="flex flex-col h-full">
        {/* Area selection tooltips */}
        {showAreaTooltip && isSelectionMode && <AreaSelectionTooltip />}
        {showTextTooltip && <TextSelectionTooltip />}
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
