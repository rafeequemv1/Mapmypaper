
import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData } from "@/utils/pdfStorage";

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
  const [isRendered, setIsRendered] = useState(false);
  const { toast } = useToast();

  // PDF tab state (active key)
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  // Track current PDF data
  const [currentPdfData, setCurrentPdfData] = useState<string | null>(null);

  // Handle active PDF change
  const handleTabChange = async (key: string) => {
    try {
      // Set the active key first
      setActivePdfKey(key);
      
      // Get the PDF data from sessionStorage
      const pdfDataKey = `pdfData_${key}`;
      let pdfData = sessionStorage.getItem(pdfDataKey);
      
      if (!pdfData) {
        toast({
          title: "PDF data not found",
          description: "The PDF data couldn't be retrieved.",
          variant: "destructive",
        });
        return;
      }
      
      // Store the PDF data in IndexedDB for the PdfViewer
      await storePdfData(pdfData);
      
      // Trigger a custom event to notify components that need to update
      window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: key } }));
      
      toast({
        title: "PDF Loaded",
        description: "PDF and mindmap switched successfully.",
      });
    } catch (error) {
      console.error("Error switching PDF:", error);
      toast({
        title: "Error Switching PDF",
        description: "Failed to switch to the selected PDF.",
        variant: "destructive",
      });
    }
  };

  // Remove pdf logic
  function handleRemovePdf(key: string) {
    // Remove data from sessionStorage
    sessionStorage.removeItem(`pdfMeta_${key}`);
    sessionStorage.removeItem(`mindMapData_${key}`);
    sessionStorage.removeItem(`pdfData_${key}`);
    
    // Set active key to another PDF if available
    const metas = getAllPdfs();
    if (activePdfKey === key) {
      if (metas.length > 0) {
        // Switch to the first available PDF
        handleTabChange(getPdfKey(metas[0]));
      } else {
        setActivePdfKey(null);
      }
    }
    
    // Notify that PDF list has changed
    window.dispatchEvent(new CustomEvent('pdfListUpdated'));
    
    toast({
      title: "PDF Removed",
      description: "The PDF has been removed.",
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsRendered(false);
    };
  }, []);

  // Enhanced event listener for opening chat with text
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      // Open chat panel if it's closed
      if (!showChat) {
        toggleChat();
      }
      // If there's text in the event detail, update the explain text
      if (event.detail?.text) {
        onExplainText(event.detail.text);
      }
    };
    window.addEventListener('openChatWithText', handleOpenChat);
    return () => {
      window.removeEventListener('openChatWithText', handleOpenChat);
    };
  }, [showChat, toggleChat, onExplainText]);

  const handleScrollToPdfPosition = (position: string) => {
    if (pdfViewerRef.current) {
      try {
        // @ts-ignore - we know this method exists
        pdfViewerRef.current.scrollToPage(parseInt(position.replace('page', ''), 10));
      } catch (error) {
        console.error("Error scrolling to PDF position:", error);
      }
    }
  };

  if (!isRendered) {
    return <div className="h-full w-full flex justify-center items-center">Loading panels...</div>;
  }

  return (
    <div className="h-full w-full flex pl-12">
      {/* PDF Panel - Fixed to 40% width */}
      {showPdf && (
        <div className="h-full w-[40%] flex-shrink-0 flex flex-col">
          {/* PDF tabs above viewer */}
          <PdfTabs
            activeKey={activePdfKey}
            onTabChange={handleTabChange}
            onRemove={handleRemovePdf}
          />
          <TooltipProvider>
            <PdfViewer 
              ref={pdfViewerRef}
              onTextSelected={onExplainText}
            />
          </TooltipProvider>
        </div>
      )}

      {/* Mind Map Panel - Takes up remaining space */}
      <div className={`h-full ${showPdf ? (showChat ? 'w-[30%]' : 'w-[60%]') : (showChat ? 'w-[70%]' : 'w-full')}`}>
        <MindMapViewer
          isMapGenerated={isMapGenerated}
          onMindMapReady={onMindMapReady}
          onExplainText={onExplainText}
          pdfKey={activePdfKey}
        />
      </div>

      {showChat && (
        <div className="h-full w-[30%] flex-shrink-0">
          <ChatPanel
            toggleChat={toggleChat}
            explainText={explainText}
            onExplainText={onExplainText}
            onScrollToPdfPosition={handleScrollToPdfPosition}
          />
        </div>
      )}

      <MobileChatSheet 
        onScrollToPdfPosition={handleScrollToPdfPosition}
        explainText={explainText}
      />
    </div>
  );
};

export default PanelStructure;
