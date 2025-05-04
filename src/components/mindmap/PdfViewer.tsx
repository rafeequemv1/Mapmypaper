import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

// Configure PDF.js worker using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  onTextSelected: (text: string) => void;
  onImageCaptured: (imageData: string) => void;
  scrollTo?: string | null;
  pdfKey: string | null;
  onPdfKeyChange: (pdfKey: string | null) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  onTextSelected, 
  onImageCaptured,
  scrollTo,
  pdfKey,
  onPdfKeyChange
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isImageCaptureMode, setIsImageCaptureMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [showSelectionBox, setShowSelectionBox] = useState(false);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load PDF data from IndexedDB
  useEffect(() => {
    const loadPdfData = async () => {
      if (pdfKey) {
        try {
          // Import the getPdfData function
          const { getPdfData } = await import('@/utils/pdfStorage');
          const data = await getPdfData(pdfKey);
          
          if (data) {
            setPdfData(data);
          } else {
            console.error('No PDF data found for key:', pdfKey);
            toast({
              title: 'Error Loading PDF',
              description: 'Could not load PDF data from storage.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error loading PDF data:', error);
          toast({
            title: 'Error Loading PDF',
            description: 'Could not load PDF data from storage.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadPdfData();
  }, [pdfKey, toast]);

  // Handle document load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }
  
  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 10) {
        onTextSelected(selectedText);
      }
    };
    
    if (!isImageCaptureMode && !isSelectionMode) {
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onTextSelected, isImageCaptureMode, isSelectionMode]);
  
  // Handle selection mode
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    
    const container = pdfContainerRef.current;
    
    const handleMouseDown = (e: MouseEvent) => {
      if (!isSelectionMode) return;
      
      // Get mouse position relative to the container
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      setShowSelectionBox(true);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectionMode || !selectionStart) return;
      
      // Get mouse position relative to the container
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setSelectionEnd({ x, y });
    };
    
    const handleMouseUp = async (e: MouseEvent) => {
      if (!isSelectionMode || !selectionStart || !selectionEnd) return;
      
      // Capture the selected area
      if (selectionBoxRef.current && 
          Math.abs(selectionEnd.x - selectionStart.x) > 20 && 
          Math.abs(selectionEnd.y - selectionStart.y) > 20) {
        
        // Get the selection box coordinates
        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);
        
        // Use html2canvas to capture the selected area
        try {
          const canvas = await html2canvas(container, {
            x: left,
            y: top,
            width: width,
            height: height,
            logging: false,
            allowTaint: true,
            useCORS: true
          });
          
          const imageData = canvas.toDataURL('image/png');
          onImageCaptured(imageData);
          
        } catch (error) {
          console.error("Error capturing selection:", error);
          toast({
            title: "Capture Failed",
            description: "Failed to capture the selected area.",
            variant: "destructive"
          });
        }
      }
      
      // Reset selection
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowSelectionBox(false);
      setIsSelectionMode(false);
      
      // Change cursor back to default
      document.body.style.cursor = 'default';
    };
    
    if (isSelectionMode) {
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      
      // Change cursor to crosshair
      document.body.style.cursor = 'crosshair';
    }
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      
      // Ensure cursor is reset
      document.body.style.cursor = 'default';
    };
  }, [isSelectionMode, selectionStart, selectionEnd, onImageCaptured, toast]);
  
  // Handle scroll to position when citation is clicked
  useEffect(() => {
    if (!scrollTo || !pdfContainerRef.current) return;
    
    const pageMatch = scrollTo.match(/page(\d+)/i);
    if (pageMatch && pageMatch[1]) {
      const pageNum = parseInt(pageMatch[1]);
      
      // Find the page element
      const pageElement = pdfContainerRef.current.querySelector(`.react-pdf__Page[data-page-number="${pageNum}"]`);
      
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight the page temporarily
        pageElement.classList.add('highlight-page');
        setTimeout(() => {
          pageElement.classList.remove('highlight-page');
        }, 2000);
      }
    }
  }, [scrollTo]);
  
  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isImageCaptureMode) setIsImageCaptureMode(false);
  };
  
  // Render PDF pages
  const renderPages = () => {
    const pages = [];
    if (numPages) {
      for (let i = 1; i <= numPages; i++) {
        pages.push(
          <Page 
            key={`page_${i}`} 
            pageNumber={i} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="mb-4 shadow-md rounded border"
          />
        );
      }
    }
    return pages;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No PDF data state
  if (!pdfData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No PDF Selected</h3>
        <p className="text-gray-500">Please select or upload a PDF to view it.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 relative">
      {/* PDF Tools */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="text-sm font-medium">
          {pdfKey ? pdfKey.split('_')[0] : 'PDF Viewer'}
          {numPages && ` (${numPages} pages)`}
        </div>
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 text-xs rounded ${isSelectionMode ? 'bg-primary text-white' : 'bg-gray-200'}`}
            onClick={toggleSelectionMode}
            title="Select region to analyze"
          >
            Select Region
          </button>
        </div>
      </div>
      
      {/* PDF Container */}
      <div 
        ref={pdfContainerRef}
        className="flex-1 overflow-auto p-4 relative"
      >
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('Error loading PDF:', error);
            toast({
              title: 'Error Loading PDF',
              description: 'Failed to load the PDF document.',
              variant: 'destructive'
            });
          }}
          className="flex flex-col items-center"
        >
          {renderPages()}
        </Document>
        
        {/* Selection Box */}
        {showSelectionBox && selectionStart && selectionEnd && (
          <div
            ref={selectionBoxRef}
            className="absolute border-2 border-blue-500 bg-blue-100 opacity-40 pointer-events-none"
            style={{
              left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
              top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
              width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
              height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
            }}
          />
        )}
      </div>
      
      {/* Page Controls */}
      <div className="p-2 bg-white border-t">
        <div className="flex justify-center items-center text-sm text-gray-700">
          {numPages && `Scroll to navigate • ${numPages} pages`}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
