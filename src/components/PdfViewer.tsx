
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
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

    // Expose the scrollToPage method to parent components
    useImperativeHandle(ref, () => ({
      scrollToPage: (pageNumber: number) => {
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
      }
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

    return (
      <div className="h-full bg-gray-50">
        {pdfData ? (
          <ScrollArea className="h-full" ref={pdfContainerRef}>
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
                    style={{ maxWidth: '90%' }}
                    data-page-number={index + 1}
                  >
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      onRenderSuccess={onPageRenderSuccess}
                      width={Math.min(600, window.innerWidth - 60)}
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
