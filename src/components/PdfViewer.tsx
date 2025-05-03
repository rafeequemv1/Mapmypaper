
import React, { forwardRef, useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getPdfData, getCurrentPdf } from "@/utils/pdfStorage";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageIcon, TextIcon } from "lucide-react";
import html2canvas from "html2canvas";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
}

const PdfViewer = forwardRef<any, PdfViewerProps>(
  ({ onTextSelected, onImageCaptured }, ref) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isAreaSelectMode, setIsAreaSelectMode] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);

    // Load current PDF from IndexedDB
    useEffect(() => {
      const loadCurrentPdf = async () => {
        try {
          setIsLoadingPdf(true);
          const currentPdfKey = await getCurrentPdf();
          if (currentPdfKey) {
            const pdfData = await getPdfData(currentPdfKey);
            if (pdfData) {
              setPdfUrl(pdfData);
            } else {
              setPdfUrl(null);
              console.error("No PDF data found for key:", currentPdfKey);
            }
          } else {
            // No current PDF
            setPdfUrl(null);
          }
        } catch (error) {
          console.error("Error loading current PDF:", error);
          toast({
            title: "Error",
            description: "Failed to load PDF",
            variant: "destructive",
          });
        } finally {
          setIsLoadingPdf(false);
        }
      };

      loadCurrentPdf();

      // Listen for PDF switch events
      const handlePdfSwitch = async (event: any) => {
        try {
          setIsLoadingPdf(true);
          const { pdfKey } = event.detail;
          if (pdfKey) {
            const pdfData = await getPdfData(pdfKey);
            if (pdfData) {
              setPdfUrl(pdfData);
              setCurrentPage(1); // Reset to first page when switching PDFs
            } else {
              setPdfUrl(null);
              console.error("No PDF data found for key:", pdfKey);
            }
          }
        } catch (error) {
          console.error("Error switching PDF:", error);
        } finally {
          setIsLoadingPdf(false);
        }
      };

      window.addEventListener("pdfSwitched", handlePdfSwitch);
      return () => window.removeEventListener("pdfSwitched", handlePdfSwitch);
    }, [toast]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
      setNumPages(numPages);
      setIsLoadingPdf(false);
    }

    function handleTextSelection() {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "" && onTextSelected) {
        onTextSelected(selection.toString().trim());
      }
    }

    // Scroll to specific page method (exposed via ref)
    const scrollToPage = (pageNumber: number) => {
      if (pageNumber < 1 || (numPages && pageNumber > numPages)) {
        console.error("Invalid page number:", pageNumber);
        return;
      }

      setCurrentPage(pageNumber);
      
      // Find the page element and scroll to it
      const pageElement = document.getElementById(`page_${pageNumber}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Toggle area selection mode
    const toggleAreaSelectMode = () => {
      setIsAreaSelectMode(!isAreaSelectMode);
      setSelectionRect(null);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    // Handle mouse down for area selection
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isAreaSelectMode) return;
      
      const rect = pdfContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setIsMouseDown(true);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
    };

    // Handle mouse move for area selection
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isAreaSelectMode || !isMouseDown || !selectionStart) return;
      
      const rect = pdfContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionEnd({ x, y });
      
      // Calculate selection rectangle
      const selRect = new DOMRect(
        Math.min(selectionStart.x, x),
        Math.min(selectionStart.y, y),
        Math.abs(x - selectionStart.x),
        Math.abs(y - selectionStart.y)
      );
      
      setSelectionRect(selRect);
    };

    // Handle mouse up for area selection
    const handleMouseUp = async () => {
      if (!isAreaSelectMode || !isMouseDown || !selectionRect || !onImageCaptured) {
        setIsMouseDown(false);
        return;
      }
      
      try {
        if (selectionRect.width < 10 || selectionRect.height < 10) {
          // Ignore tiny selections
          setIsMouseDown(false);
          return;
        }

        const element = pdfContainerRef.current;
        if (!element) {
          setIsMouseDown(false);
          return;
        }
        
        // Convert the selected area to an image
        const canvas = await html2canvas(element, {
          x: selectionRect.x,
          y: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff"
        });
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL("image/jpeg");
        onImageCaptured(imageData);
        
        // Reset selection
        setSelectionRect(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsAreaSelectMode(false);
      } catch (error) {
        console.error("Error capturing area:", error);
        toast({
          title: "Capture Failed",
          description: "Failed to capture the selected area",
          variant: "destructive",
        });
      }
      
      setIsMouseDown(false);
    };

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      scrollToPage,
    }));

    if (!pdfUrl) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 text-gray-500">
          <p>No PDF loaded. Please upload or select a PDF.</p>
        </div>
      );
    }

    return (
      <div className="pdf-viewer h-full flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white p-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {numPages && `Page ${currentPage} of ${numPages}`}
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-1 rounded-md ${isAreaSelectMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  onClick={toggleAreaSelectMode}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select area to analyze image</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-1 rounded-md hover:bg-gray-100"
                  onClick={() => toast({
                    title: "Text Selection",
                    description: "Select text in the PDF and it will be automatically captured",
                  })}
                >
                  <TextIcon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select text to analyze</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* PDF Document */}
        <div 
          className="flex-1 overflow-auto relative"
          ref={pdfContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => isMouseDown && handleMouseUp()}
        >
          {isLoadingPdf && (
            <div className="p-4">
              <Skeleton className="h-[800px] w-full rounded-md" />
            </div>
          )}
          
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error("Error loading PDF:", error);
              setIsLoadingPdf(false);
            }}
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <div 
                key={`page_${index + 1}`} 
                id={`page_${index + 1}`}
                className="mb-4"
                onMouseUp={handleTextSelection}
              >
                <Page 
                  pageNumber={index + 1} 
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  onRenderSuccess={() => setCurrentPage(index + 1)}
                  className="shadow-md"
                />
              </div>
            ))}
          </Document>
          
          {/* Selection overlay */}
          {selectionRect && isAreaSelectMode && (
            <div
              style={{
                position: 'absolute',
                border: '2px dashed #3b82f6',
                background: 'rgba(59, 130, 246, 0.1)',
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
