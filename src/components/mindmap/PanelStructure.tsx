
import { useRef, useState, useEffect } from "react";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import ExtractedFiguresPanel from "@/components/mindmap/ExtractedFiguresPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { retrievePDF } from "@/utils/pdfStorage";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const PanelStructure = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  onExplainText,
}: PanelStructureProps) => {
  const isMapGenerated = true;
  const pdfViewerRef = useRef(null);
  const { toast } = useToast();
  const [pdfKey, setPdfKey] = useState(Date.now());
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [explainImage, setExplainImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [showFigures, setShowFigures] = useState(false);
  const [extractedFigures, setExtractedFigures] = useState<{ imageData: string; pageNumber: number }[]>([]);
  const mindMapRef = useRef<any>(null);
  
  // Check for PDF availability and extract figures when component mounts
  useEffect(() => {
    const checkPdfAvailability = async () => {
      try {
        console.log("Checking for PDF data in storage...");
        setLoadingPdf(true);
        
        // Try to retrieve PDF from IndexedDB (which will also check session storage)
        const pdfData = await retrievePDF();
        
        if (pdfData) {
          console.log("Found PDF data in storage, length:", pdfData.length);
          // Update the key to force component remount
          setPdfKey(Date.now());
          setPdfLoaded(true);
          console.log("PDF refreshed to avoid cache issues");
          
          // Check if figures are already stored in session storage
          const storedFigures = sessionStorage.getItem('extractedFigures');
          if (storedFigures) {
            setExtractedFigures(JSON.parse(storedFigures));
            console.log("Loaded extracted figures from session storage");
          }
        } else {
          console.log("No PDF data found in storage");
          toast({
            title: "No PDF Found",
            description: "Please upload a PDF document first",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking PDF availability:", error);
        toast({
          title: "Error Loading PDF",
          description: "There was a problem loading your PDF. Please try uploading it again.",
          variant: "destructive",
        });
      } finally {
        setLoadingPdf(false);
      }
    };
    
    // Run check with a slight delay to ensure storage is checked after navigation
    checkPdfAvailability();
  }, [toast]);
  
  const handlePdfLoaded = () => {
    console.log("PDF loaded successfully");
    setPdfLoaded(true);
  };
  
  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      // @ts-ignore - we know this method exists
      pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
    }
  };
  
  const handleImageSelected = (imageData: string) => {
    console.log("Image area selected in PDF, data length:", imageData.length);
    setExplainImage(imageData);
    
    // Automatically open chat panel when an image is selected for explanation
    if (!showChat) {
      toggleChat();
    }
  };

  const handleAddImageToMindMap = (imageData: string) => {
    if (mindMapRef.current && mindMapRef.current.addImage) {
      mindMapRef.current.addImage(imageData);
      toast({
        title: "Image Added",
        description: "Figure has been added to the mind map",
      });
    } else {
      toast({
        title: "Cannot Add Image",
        description: "Mind map is not ready or does not support images",
        variant: "destructive",
      });
    }
  };

  const toggleFiguresPanel = () => {
    setShowFigures(!showFigures);
  };

  // Calculate the width for each panel based on what's visible
  const getPdfPanelWidth = () => {
    if (!showPdf) return "0%";
    if (showChat) {
      if (showFigures) return "30%";
      return "40%";
    }
    if (showFigures) return "40%";
    return "40%";
  };

  const getMindMapPanelWidth = () => {
    if (showPdf) {
      if (showChat) {
        if (showFigures) return "20%";
        return "30%";
      }
      if (showFigures) return "30%";
      return "60%";
    }
    if (showChat) {
      if (showFigures) return "40%";
      return "70%";
    }
    if (showFigures) return "70%";
    return "100%";
  };

  const getChatPanelWidth = () => {
    return showChat ? "30%" : "0%";
  };

  const getFiguresPanelWidth = () => {
    return showFigures ? "20%" : "0%";
  };

  return (
    <div className="h-full w-full flex">
      {/* PDF Panel */}
      {showPdf && (
        <div className="h-full" style={{ width: getPdfPanelWidth(), flexShrink: 0 }}>
          <TooltipProvider>
            <PdfViewer 
              key={pdfKey}
              ref={pdfViewerRef}
              onImageSelected={handleImageSelected}
              onPdfLoaded={handlePdfLoaded}
            />
          </TooltipProvider>
        </div>
      )}

      {/* Mind Map Panel */}
      <div className="h-full" style={{ width: getMindMapPanelWidth() }}>
        <div className="h-full relative">
          <MindMapViewer
            isMapGenerated={isMapGenerated}
            onMindMapReady={(instance: any) => {
              onMindMapReady(instance);
              mindMapRef.current = { addImage: (imageData: string) => {
                if (instance) {
                  // Logic to add image to mind map would be here
                  console.log("Adding image to mind map");
                }
              }};
            }}
          />
          
          {/* Figures toggle button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={toggleFiguresPanel}
          >
            <Images className="h-4 w-4 mr-1" />
            {showFigures ? "Hide Figures" : "Show Figures"}
          </Button>
        </div>
      </div>

      {/* Extracted Figures Panel */}
      {showFigures && (
        <div className="h-full border-l" style={{ width: getFiguresPanelWidth(), flexShrink: 0 }}>
          <ExtractedFiguresPanel 
            figures={extractedFigures} 
            onAddToMindMap={handleAddImageToMindMap} 
          />
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="h-full border-l" style={{ width: getChatPanelWidth(), flexShrink: 0 }}>
          <ChatPanel
            toggleChat={toggleChat}
            explainText={explainText}
            explainImage={explainImage}
            onExplainText={onExplainText}
            onScrollToPdfPosition={handleScrollToPdfPosition}
          />
        </div>
      )}

      {/* Mobile Chat Sheet */}
      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
      />
    </div>
  );
};

export default PanelStructure;
