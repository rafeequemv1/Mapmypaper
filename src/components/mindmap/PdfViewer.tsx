import React, { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, XCircle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCurrentPdf } from "@/utils/pdfStorage";
import html2canvas from "html2canvas";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected: (text: string) => void;
  onImageCaptured: (imageData: string) => void;
  scrollTo: string | null;
  pdfKey: string | null;
  onPdfKeyChange: (pdfKey: string | null) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ onTextSelected, onImageCaptured, scrollTo, pdfKey, onPdfKeyChange }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const { toast } = useToast();
  const textLayerRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>({});
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Load PDF data from IndexedDB when the component mounts or pdfKey changes
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfKey) {
        setPdfData(null);
        return;
      }

      try {
        const storedData = sessionStorage.getItem(`pdfData_${pdfKey}`);
        if (storedData) {
          setPdfData(storedData);
          await setCurrentPdf(pdfKey);
          console.log(`PDF data loaded from session storage for key: ${pdfKey}`);
        } else {
          setPdfData(null);
          console.warn(`PDF data not found in session storage for key: ${pdfKey}`);
        }
      } catch (error) {
        console.error("Error loading PDF data:", error);
        toast({
          title: "Error",
          description: "Failed to load PDF data.",
          variant: "destructive",
        });
        setPdfData(null);
      }
    };

    loadPdf();
  }, [pdfKey, toast]);

  // Initialize textLayerRefs for each page
  useEffect(() => {
    if (numPages) {
      const refs: { [key: number]: React.RefObject<HTMLDivElement> } = {};
      for (let i = 1; i <= numPages; i++) {
        refs[i] = React.createRef<HTMLDivElement>();
      }
      textLayerRefs.current = refs;
    }
  }, [numPages]);

  // Handle PDF loaded successfully
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Change page number
  const changePage = (amount: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + amount;
      if (newPageNumber >= 1 && newPageNumber <= numPages!) {
        return newPageNumber;
      } else {
        return prevPageNumber;
      }
    });
  };

  // Go to previous page
  const goToPrevPage = () => changePage(-1);

  // Go to next page
  const goToNextPage = () => changePage(1);

  // Handle text selection
  const handleTextLayerRendered = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection) {
        const selectedText = selection.toString().trim();
        if (selectedText) {
          setHighlightedText(selectedText);
          onTextSelected(selectedText);
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new CustomEvent('openChatWithText', { detail: { text: selectedText } }));
        }
      }
    };

    container.addEventListener('mouseup', handleSelection);

    return () => {
      container.removeEventListener('mouseup', handleSelection);
    };
  }, [onTextSelected]);

  // Capture image
  const captureImage = useCallback(() => {
    const pageContainer = document.querySelector('.react-pdf__Page');

    if (pageContainer) {
      html2canvas(pageContainer as HTMLElement).then(canvas => {
        const imageData = canvas.toDataURL('image/jpeg');
        onImageCaptured(imageData);
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('openChatWithImage', { detail: { imageData: imageData } }));
      });
    }
  }, [onImageCaptured]);

  // Scroll to function
  useEffect(() => {
    if (scrollTo && textLayerRefs.current[pageNumber] && textLayerRefs.current[pageNumber].current) {
      const textLayer = textLayerRefs.current[pageNumber].current;
      if (textLayer) {
        const element = textLayer.querySelector(`[data-annotation-id="${scrollTo}"]`);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }
    }
  }, [scrollTo, pageNumber]);

  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
  };

  // PDF pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.clientX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1; //scroll speed
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="react-pdf__container flex-grow relative overflow-auto cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {pdfData ? (
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            className="overflow-auto"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              onRenderSuccess={handleTextLayerRendered}
              inputRef={(ref) => {
                if (textLayerRefs.current[pageNumber]) {
                  // We need to cast because inputRef expects an MutableRefObject but we're using RefObject
                  (textLayerRefs.current[pageNumber] as any).current = ref;
                }
              }}
            />
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full">
            {pdfKey ? (
              <p>Loading PDF...</p>
            ) : (
              <p>No PDF selected.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation and Search */}
      <div className="flex items-center justify-between p-2 border-t">
        <div className="flex items-center">
          <Button
            onClick={captureImage}
            size="icon"
            variant="outline"
            className="mr-2"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <button
            disabled={pageNumber <= 1}
            onClick={goToPrevPage}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="mx-2">
            Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
          </span>
          <button
            disabled={pageNumber >= numPages!}
            onClick={goToNextPage}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="flex items-center">
          <Search className="h-4 w-4 mr-2 text-gray-500" />
          <div className="relative">
            {searchQuery && (
              <XCircle
                onClick={resetSearch}
                className="absolute right-1 top-1 h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer"
              />
            )}
            <Input
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 text-xs mr-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
