import React, { forwardRef } from 'react';
import { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useSearchParams } from "@/hooks/useSearchParams";
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected: (text: string) => void;
  onPdfLoaded: () => void;
  onImageCaptured: (imageData: string) => void;
}

const PdfViewer = forwardRef<any, PdfViewerProps>(({ onTextSelected, onPdfLoaded, onImageCaptured }, ref) => {
  const searchParams = useSearchParams();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const { toast } = useToast();
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionRef = useRef<any>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [imageCaptureMode, setImageCaptureMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const storedPdfData = searchParams.get('pdf');
    if (storedPdfData) {
      setPdfData(storedPdfData);
    } else {
      const uploadedPdfData = sessionStorage.getItem('pdfData');
      if (uploadedPdfData) {
        setPdfData(uploadedPdfData);
      } else {
        toast({
          title: "No PDF found",
          description: "Please upload a PDF to view it.",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, toast]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onPdfLoaded();
  };

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => (prevPageNumber > 1 ? prevPageNumber - 1 : 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => (prevPageNumber < (numPages || 1) ? prevPageNumber + 1 : numPages || 1));
  };

  const handleMouseDown = (e: any) => {
    if (imageCaptureMode) return;
    setIsSelecting(true);
    selectionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    };
  };

  const handleMouseMove = (e: any) => {
    if (!isSelecting || imageCaptureMode) return;
    if (!selectionRef.current) return;

    selectionRef.current.endX = e.clientX;
    selectionRef.current.endY = e.clientY;

    const startX = Math.min(selectionRef.current.startX, selectionRef.current.endX);
    const startY = Math.min(selectionRef.current.startY, selectionRef.current.endY);
    const width = Math.abs(selectionRef.current.startX - selectionRef.current.endX);
    const height = Math.abs(selectionRef.current.startY - selectionRef.current.endY);

    const selectionBox = document.getElementById('selectionBox');
    if (selectionBox) {
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
    }
  };

  const handleMouseUp = () => {
    if (imageCaptureMode) return;
    setIsSelecting(false);

    if (!selectionRef.current) return;

    const startX = Math.min(selectionRef.current.startX, selectionRef.current.endX);
    const startY = Math.min(selectionRef.current.startY, selectionRef.current.endY);
    const width = Math.abs(selectionRef.current.startX - selectionRef.current.endX);
    const height = Math.abs(selectionRef.current.startY - selectionRef.current.endY);

    const selectionBox = document.getElementById('selectionBox');
    if (selectionBox) {
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
    }

    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.length > 0) {
      onTextSelected(selectedText);
    }

    // Clear selection box
    setTimeout(() => {
      const selectionBox = document.getElementById('selectionBox');
      if (selectionBox) {
        selectionBox.style.left = '0';
        selectionBox.style.top = '0';
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
      }
    }, 100);
  };

  const captureImage = async () => {
    if (!pageRef.current) {
      toast({
        title: "Capture Failed",
        description: "Unable to capture image. PDF page not loaded.",
        variant: "destructive",
      });
      return;
    }

    setImageCaptureMode(true);

    // Wait for the next paint to ensure the PDF is rendered
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || !pageRef.current) {
        toast({
          title: "Capture Failed",
          description: "Canvas or PDF page not available.",
          variant: "destructive",
        });
        setImageCaptureMode(false);
        return;
      }

      const canvasContext = canvas.getContext('2d');
      if (!canvasContext) {
        toast({
          title: "Capture Failed",
          description: "Could not get canvas context.",
          variant: "destructive",
        });
        setImageCaptureMode(false);
        return;
      }

      const pixelRatio = window.devicePixelRatio || 1;
      const rect = pageRef.current.getBoundingClientRect();
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvasContext.scale(pixelRatio, pixelRatio);

      // Get the PDF page as an image
      const img = new Image();
      img.onload = () => {
        canvasContext.drawImage(img, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);

        // Convert canvas content to data URL
        const imageData = canvas.toDataURL('image/png');

        // Invoke the callback with the image data
        onImageCaptured(imageData);

        // Reset image capture mode
        setImageCaptureMode(false);
      };

      // Get the PDF page as an image
      const pageCanvas = pageRef.current.querySelector('canvas');
      if (pageCanvas) {
        img.src = pageCanvas.toDataURL('image/png');
      } else {
        toast({
          title: "Capture Failed",
          description: "Could not get PDF page as image.",
          variant: "destructive",
        });
        setImageCaptureMode(false);
      }
    });
  };

  return (
    <div
      className="pdf-viewer-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: 'relative', userSelect: 'none' }}
    >
      {pdfData ? (
        <>
          <div ref={pageRef} style={{ position: 'relative' }}>
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              className="overflow-auto"
            >
              <Page pageNumber={pageNumber} renderTextLayer={true} renderAnnotationLayer={true} />
            </Document>
            <div
              id="selectionBox"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                border: '2px solid blue',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Canvas for capturing the image */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="flex justify-between items-center mt-2">
            <Button onClick={goToPrevPage} disabled={pageNumber <= 1}>
              Prev
            </Button>
            <span>
              Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
            </span>
            <Button onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)}>
              Next
            </Button>
          </div>

          <div className="flex justify-center mt-2">
            <Button onClick={captureImage} disabled={imageCaptureMode}>
              {imageCaptureMode ? 'Capturing...' : <><Camera className="mr-2 h-4 w-4" /> Capture Image</>}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading PDF...</p>
        </div>
      )}
    </div>
  );
});

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
