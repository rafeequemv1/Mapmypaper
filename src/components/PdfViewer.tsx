import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Document, Page } from "react-pdf";
import * as pdfjs from "pdfjs-dist";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  RectangleHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl?: string;
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
  onPdfLoaded?: () => void;
  renderTooltipContent?: (props: any) => React.ReactNode;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onImageCaptured, onPdfLoaded, renderTooltipContent }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<
      { pageNumber: number; text: string }[]
    >([]);
    const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [selectionRect, setSelectionRect] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);
    const [showAreaTooltip, setShowAreaTooltip] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
    const selectionRectRef = useRef<{
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
      left: number | null;
      top: number | null;
    }>({
      x: null,
      y: null,
      width: null,
      height: null,
      left: null,
      top: null,
    });
    const activePdfPageRef = useRef<number | null>(1);
    let selectionCanvas: HTMLCanvasElement | null = null;
    const { toast } = useToast();

    const loadPdfData = useCallback(async (url: string) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        setPdfData(uint8Array);
        if (onPdfLoaded) {
          onPdfLoaded();
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        toast({
          title: "PDF Load Error",
          description: "Failed to load the PDF from the provided URL.",
          variant: "destructive",
        });
      }
    }, [onPdfLoaded, toast]);

    useEffect(() => {
      // Load PDF data when the component mounts
      const pdfURL = (document.querySelector("#pdf-url") as HTMLInputElement)
        ?.value;
      if (pdfURL) {
        loadPdfData(pdfURL);
      }
    }, [loadPdfData]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
    };

    const goToPrevPage = () => {
      setPageNumber((prevPageNumber) =>
        prevPageNumber <= 1 ? prevPageNumber : prevPageNumber - 1
      );
    };

    const goToNextPage = () => {
      setPageNumber((prevPageNumber) =>
        prevPageNumber >= numPages! ? prevPageNumber : prevPageNumber + 1
      );
    };

    const handleTextLayerRendered = useCallback(() => {
      if (!isSelectionMode) {
        // Get the text content of the current page
        const textLayerDiv = document.querySelector(
          `[data-page-number="${pageNumber}"] .react-pdf__Page__textContent`
        );

        if (textLayerDiv) {
          const textContent = textLayerDiv.textContent || "";

          // Notify parent component about the selected text
          if (onTextSelected) {
            onTextSelected(textContent);
          }

          // Dispatch a custom event to open the chat with the text
          const event = new CustomEvent("openChatWithText", {
            detail: { text: textContent },
          });
          window.dispatchEvent(event);
        }
      }
    }, [pageNumber, isSelectionMode, onTextSelected]);

    useEffect(() => {
      // Set up the selection canvas when selection mode is enabled
      if (isSelectionMode && pdfContainerRef.current) {
        // Get the first PDF page element
        const pdfPage = pdfContainerRef.current.querySelector(
          '[data-page-number="1"]'
        ) as HTMLElement;

        if (pdfPage) {
          // Get the dimensions of the PDF page
          const { width, height } = pdfPage.getBoundingClientRect();

          // Create a canvas element for selection overlay
          selectionCanvas = selectionCanvasRef.current;

          if (selectionCanvas) {
            // Set canvas dimensions to match the PDF page
            selectionCanvas.width = width;
            selectionCanvas.height = height;
            selectionCanvas.style.position = "absolute";
            selectionCanvas.style.top = "0";
            selectionCanvas.style.left = "0";
            selectionCanvas.style.zIndex = "10";
          }
        }
      } else {
        // Clear the selection canvas when selection mode is disabled
        const canvas = selectionCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    }, [isSelectionMode]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelectionMode) {
        const canvas = selectionCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionStart({ x, y });
        selectionRectRef.current = {
          x,
          y,
          width: 0,
          height: 0,
          left: rect.left,
          top: rect.top,
        };
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelectionMode && selectionStart) {
        const canvas = selectionCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const width = x - selectionStart.x;
        const height = y - selectionStart.y;

        setSelectionRect({
          x: selectionStart.x,
          y: selectionStart.y,
          width,
          height,
        });

        selectionRectRef.current = {
          x: selectionStart.x,
          y: selectionStart.y,
          width,
          height,
          left: rect.left,
          top: rect.top,
        };

        setShowAreaTooltip(true);
        setTooltipPosition({ x: e.clientX, y: e.clientY });

        // Draw the selection rectangle on the canvas
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(0, 123, 255, 0.3)";
          ctx.fillRect(selectionStart.x, selectionStart.y, width, height);
        }
      }
    };

    const handleMouseUp = () => {
      if (isSelectionMode && selectionStart && selectionRect) {
        // Capture the selected area
        captureSelectedArea();
        setSelectionStart(null);
        setSelectionRect(null);
      }
    };

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
        tempCanvas.width = rect.width as number;
        tempCanvas.height = rect.height as number;
        
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
        
        // Get the viewport offset
        const viewportRect = scrollContainer?.getBoundingClientRect() || { left: 0, top: 0 };
        
        // Convert page element to image
        html2canvas(targetPage as HTMLElement, {
          backgroundColor: null,
          scale: window.devicePixelRatio, // Use device pixel ratio for better quality
          useCORS: true,
          // Fix: Include scrolling position in calculation
          scrollX: -scrollLeft,
          scrollY: -scrollTop,
          // Fix: Account for the viewport position
          x: pageRect.left - viewportRect.left,
          y: pageRect.top - viewportRect.top,
        }).then(pageCanvas => {
          // Calculate the correct offset within the page, accounting for scaling, scrolling, and viewport position
          const canvasOffset = {
            // Fix: Improve the offset calculation to be more accurate
            x: (rect.left! - (pageRect.left - viewportRect.left)) / window.devicePixelRatio,
            y: (rect.top! - (pageRect.top - scrollTop)) / window.devicePixelRatio
          };
          
          console.log('Capture details:', {
            rectLeft: rect.left,
            rectTop: rect.top,
            pageRectLeft: pageRect.left,
            pageRectTop: pageRect.top,
            viewportRectLeft: viewportRect.left,
            viewportRectTop: viewportRect.top,
            scrollTop,
            scrollLeft,
            offsetX: canvasOffset.x,
            offsetY: canvasOffset.y,
            devicePixelRatio: window.devicePixelRatio
          });
          
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

    const handleSearch = () => {
      if (!pdfData) return;

      // Load the PDF document
      pdfjs.getDocument({ data: pdfData })
        .promise.then((pdf) => {
          const searchText = searchQuery.toLowerCase();
          const results: { pageNumber: number; text: string }[] = [];

          // Iterate through each page
          const searchPromises: Promise<void>[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            searchPromises.push(
              pdf.getPage(i).then((page) => {
                return page.getTextContent().then((textContent) => {
                  const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ")
                    .toLowerCase();
                  if (pageText.includes(searchText)) {
                    results.push({ pageNumber: i, text: pageText });
                  }
                });
              })
            );
          }

          Promise.all(searchPromises).then(() => {
            setSearchResults(results);
            setCurrentSearchResultIndex(results.length > 0 ? 0 : -1);
            if (results.length === 0) {
              toast({
                title: "No results found",
                description: "No matching results found in the document.",
              });
            } else {
              toast({
                title: "Search complete",
                description: `${results.length} results found in the document.`,
              });
            }
          });
        })
        .catch((error) => {
          console.error("Error during search:", error);
          toast({
            title: "Search Error",
            description: "An error occurred during the search process.",
            variant: "destructive",
          });
        });
    };

    const scrollToPage = (pageNumber: number) => {
      // Find the element with the data-page-number attribute
      const pageElement = document.querySelector(
        `[data-page-number="${pageNumber}"]`
      );

      if (pageElement) {
        // Scroll the element into view
        pageElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });

        // Dispatch a custom event to indicate the PDF page has been switched
        const event = new CustomEvent("pdfSwitched", {
          detail: { pdfKey: `pdf_${pageNumber}` },
        });
        window.dispatchEvent(event);

        // Set the active PDF page number
        activePdfPageRef.current = pageNumber;
      } else {
        console.warn(`Page number ${pageNumber} not found in the document.`);
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToPage: (pageNumber: number) => {
        scrollToPage(pageNumber);
        setPageNumber(pageNumber);
      },
    }));

    const goToSearchResult = (direction: "prev" | "next") => {
      if (searchResults.length === 0) return;

      let newIndex = currentSearchResultIndex;
      if (direction === "next") {
        newIndex =
          currentSearchResultIndex < searchResults.length - 1
            ? currentSearchResultIndex + 1
            : 0;
      } else {
        newIndex =
          currentSearchResultIndex > 0
            ? currentSearchResultIndex - 1
            : searchResults.length - 1;
      }

      setCurrentSearchResultIndex(newIndex);
      scrollToPage(searchResults[newIndex].pageNumber);
      setPageNumber(searchResults[newIndex].pageNumber);
    };

    const handleZoomIn = () => {
      setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 0.1, 2.0));
    };

    const handleZoomOut = () => {
      setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.1, 0.5));
    };

    const TooltipContent = ({ x, y }: { x: number; y: number }) => {
      return (
        <div
          style={{
            position: "fixed",
            top: y - 50,
            left: x + 10,
            zIndex: 100,
            backgroundColor: "white",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        >
          {renderTooltipContent ? (
            renderTooltipContent({ setShowAreaTooltip, setIsSelectionMode })
          ) : (
            <>
              <p>Do you want to capture this area?</p>
              <Button
                size="sm"
                onClick={() => {
                  captureSelectedArea();
                  setShowAreaTooltip(false);
                  setIsSelectionMode(false);
                }}
              >
                Capture Area
              </Button>
            </>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages!}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pageNumber || (numPages ? "?" : "-")} of {numPages || "?"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[200px]"
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSearchResult("prev")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSearchResult("next")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentSearchResultIndex + 1} / {searchResults.length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
            >
              {isSelectionMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Exit Area Select
                </>
              ) : (
                <>
                  <RectangleHorizontal className="h-4 w-4 mr-2" />
                  Select Area
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div
          className="flex-grow relative overflow-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={pdfContainerRef}
        >
          <ScrollArea className="h-full">
            {pdfData ? (
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                }}
              >
                <Document
                  file={{ data: pdfData }}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) =>
                    console.error("Error loading document:", error)
                  }
                  loading="Loading PDF..."
                  error="Failed to load PDF."
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    onRenderSuccess={handleTextLayerRendered}
                  >
                    <canvas
                      ref={selectionCanvasRef}
                      style={{ position: "absolute", top: 0, left: 0 }}
                    />
                  </Page>
                </Document>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span>Loading PDF...</span>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Area Selection Tooltip */}
        {showAreaTooltip && tooltipPosition && (
          <TooltipContent x={tooltipPosition.x} y={tooltipPosition.y} />
        )}
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
