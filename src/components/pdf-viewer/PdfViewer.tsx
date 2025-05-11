
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCurrentPdfData } from "@/utils/pdfStorage";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Import the new components
import PdfToolbar from "./PdfToolbar";
import PdfDocumentViewer from "./PdfDocumentViewer";
import PdfSelectionTooltip from "./PdfSelectionTooltip";
import PdfSnapshotIndicator from "./PdfSnapshotIndicator";

// Import custom hooks
import usePdfSearch from "./hooks/usePdfSearch";
import usePdfSelection from "./hooks/usePdfSelection";
import usePdfNavigation from "./hooks/usePdfNavigation";
import useSnapshotMode from "./hooks/useSnapshotMode";

interface PdfViewerProps {
  onTextSelected?: (text: string) => void;
  onPdfLoaded?: () => void;
  onImageCaptured?: (imageData: string) => void;
  renderTooltipContent?: () => React.ReactNode;
  highlightByDefault?: boolean;
  isSnapshotMode?: boolean;
  setIsSnapshotMode?: (isActive: boolean) => void;
}

interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
  ({ onTextSelected, onPdfLoaded, onImageCaptured, renderTooltipContent, highlightByDefault = false, isSnapshotMode = false, setIsSnapshotMode }, ref) => {
    // State for PDF data and loading
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [pdfKey, setPdfKey] = useState<string | null>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>(1);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    
    // Use custom hooks
    const { 
      numPages, setNumPages, pageHeight, pagesRef, 
      onDocumentLoadSuccess, onPageRenderSuccess, setPageRef, 
      scrollToPosition, scrollToPage 
    } = usePdfNavigation();
    
    const { 
      searchQuery, setSearchQuery, searchResults, setSearchResults,
      currentSearchIndex, setCurrentSearchIndex, 
      showSearch, toggleSearch, handleSearch, navigateSearch, handleSearchKeyDown,
      activeHighlightRef, setActiveHighlightRef
    } = usePdfSearch();
    
    const {
      selectedText, tooltipPosition, showSelectionTooltip, 
      setShowSelectionTooltip, tooltipTextRef, selectionTooltipRef
    } = usePdfSelection(pdfContainerRef, highlightByDefault);
    
    const {
      localIsSnapshotMode, isProcessingCapture, captureError,
      toggleSnapshotMode, handleCancelSnapshot
    } = useSnapshotMode(pdfContainerRef, viewportRef, isSnapshotMode, setIsSnapshotMode, onImageCaptured);

    // Load PDF data
    const loadPdfData = async () => {
      try {
        setIsLoading(true);
        const data = await getCurrentPdfData();
        
        if (data) {
          setPdfData(data);
          console.log("PDF data loaded successfully from IndexedDB");
        } else {
          setLoadError("No PDF found. Please upload a PDF document first.");
        }
      } catch (error) {
        console.error("Error retrieving PDF data:", error);
        setLoadError("Could not load the PDF document.");
      } finally {
        setIsLoading(false);
      }
    };

    // Load PDF on component mount
    useEffect(() => {
      loadPdfData();
    }, []);

    // Handle PDF switching
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
    }, []);

    // Store the viewport ref when the scroll area is mounted
    useEffect(() => {
      if (pdfContainerRef.current) {
        viewportRef.current = pdfContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      }
    }, [pdfContainerRef.current]);

    // Explain text handler
    const handleExplainText = () => {
      if (selectedText && onTextSelected) {
        onTextSelected(selectedText);
        
        // Dispatch custom event for opening chat with text
        window.dispatchEvent(
          new CustomEvent('openChatWithText', { detail: { text: selectedText } })
        );
        
        // Do NOT clear selection - keep the tooltip visible and the text highlighted
        setShowSelectionTooltip(true);
      }
    };

    // Handle document load success with callback
    const handleDocumentLoadSuccess = (result: { numPages: number }) => {
      onDocumentLoadSuccess(result);
      if (onPdfLoaded) {
        onPdfLoaded();
      }
      setLoadError(null);
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

    // Handle search result navigation with scrolling
    const handleSearchWithScroll = () => {
      const position = handleSearch();
      if (position) {
        scrollToPosition(position, scrollToPage);
      }
    };

    // Handle search navigation with scrolling
    const handleNavigateSearchWithScroll = (direction: 'next' | 'prev') => {
      const position = navigateSearch(direction);
      if (position) {
        scrollToPosition(position, scrollToPage);
      }
    };

    // Expose scrollToPage method via ref
    useImperativeHandle(ref, () => ({
      scrollToPage: (pageNumber: number) => {
        scrollToPage(pageNumber, activeHighlightRef);
      }
    }), [numPages, activeHighlightRef]);
    
    // Listen for scroll to page events
    useEffect(() => {
      const handleScrollToPdfPage = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { pageNumber } = customEvent.detail || {};
        if (pageNumber && typeof pageNumber === 'number') {
          console.log("Custom event received to scroll to page:", pageNumber);
          scrollToPage(pageNumber, activeHighlightRef);
        }
      };
      
      window.addEventListener('scrollToPdfPage', handleScrollToPdfPage);
      
      return () => {
        window.removeEventListener('scrollToPdfPage', handleScrollToPdfPage);
      };
    }, [numPages, activeHighlightRef, scrollToPage]);

    return (
      <div className="h-full flex flex-col bg-gray-50" data-pdf-viewer>
        {/* PDF Toolbar */}
        <PdfToolbar
          scale={scale}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          isSnapshotMode={localIsSnapshotMode}
          toggleSnapshotMode={toggleSnapshotMode}
          handleSearch={handleSearchWithScroll}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          toggleSearch={toggleSearch}
          navigateSearch={handleNavigateSearchWithScroll}
          showSearch={showSearch}
          handleSearchKeyDown={handleSearchKeyDown}
        />

        {/* PDF Content */}
        <ScrollArea className="flex-1" ref={pdfContainerRef}>
          <div className="flex flex-col items-center py-4 relative">
            {/* Snapshot mode indicator */}
            <PdfSnapshotIndicator
              isSnapshotMode={localIsSnapshotMode}
              isProcessingCapture={isProcessingCapture}
              handleCancelSnapshot={handleCancelSnapshot}
            />
            
            {/* Selection Tooltip */}
            <PdfSelectionTooltip
              showTooltip={showSelectionTooltip}
              position={tooltipPosition}
              tooltipRef={selectionTooltipRef}
              handleExplainText={handleExplainText}
            />
            
            {/* PDF Document */}
            <PdfDocumentViewer
              pdfData={pdfData}
              scale={scale}
              onDocumentLoadSuccess={handleDocumentLoadSuccess}
              onPageRenderSuccess={onPageRenderSuccess}
              pagesRef={pagesRef}
              setPageRef={setPageRef}
              getOptimalPageWidth={getOptimalPageWidth}
              numPages={numPages}
              loadError={loadError}
              isLoading={isLoading}
            />
          </div>
        </ScrollArea>
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";

export default PdfViewer;
