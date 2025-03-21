import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PdfViewerProps {
  className?: string;
  onRequestOpenChat?: () => void;
  onTogglePdf?: () => void;
  onExplainText?: (text: string) => void;
  defaultZoom?: number;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  className,
  onRequestOpenChat,
  onTogglePdf,
  onExplainText,
  defaultZoom = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);
  const [selectedText, setSelectedText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Try to get PDF data from different sources
    const pdfData = sessionStorage.getItem("pdfData");
    const pdfUrl = sessionStorage.getItem("pdfUrl");
    const pdfFileName = sessionStorage.getItem("pdfFileName") || "Document";
    
    setPdfFileName(pdfFileName);
    
    if (pdfUrl) {
      // If we have a URL, use it directly
      setPdfUrl(pdfUrl);
    } else if (pdfData) {
      // If we have data, use it
      setPdfUrl(pdfData);
    } else {
      console.error("No PDF data or URL found in sessionStorage");
      toast({
        title: "Error",
        description: "Could not load PDF. Please try uploading again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2.5));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const handleTextSelection = () => {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString().trim());
      }
    }
  };

  const handleExplainText = () => {
    if (selectedText && onExplainText) {
      onExplainText(selectedText);
    } else if (onRequestOpenChat) {
      onRequestOpenChat();
    }
  };

  return (
    <div
      className={`flex flex-col h-full ${className || ""} ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : ""
      }`}
    >
      {/* PDF Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center">
          <h3 className="text-sm font-medium truncate max-w-[200px]">
            {pdfFileName}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={zoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onTogglePdf}
              title="Close PDF"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div
        className="flex-1 overflow-auto bg-gray-100 relative"
        ref={containerRef}
        onMouseUp={handleTextSelection}
      >
        {pdfUrl ? (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
          >
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading PDF...</p>
          </div>
        )}

        {/* Floating button for explaining selected text */}
        {selectedText && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={handleExplainText}
              className="shadow-lg flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Explain Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
