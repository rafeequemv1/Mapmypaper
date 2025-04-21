
import { useRef, useState, useEffect } from "react";
import PdfTabs from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const getAllPdfMetas = () => {
  const keys = Object.keys(sessionStorage)
    .filter((k) => k.startsWith("pdfMeta_"))
    .map((k) => k.replace("pdfMeta_", ""));
  return keys.map((key) => {
    try {
      return JSON.parse(sessionStorage.getItem(`pdfMeta_${key}`) || "");
    } catch {
      return null;
    }
  }).filter(Boolean);
};

const getPdfKey = (meta: { name: string; size: number; lastModified: number }) =>
  `${meta.name}_${meta.size}_${meta.lastModified}`;

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

  // PDF tab state (active key)
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfMetas();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  // Remove pdf logic
  function handleRemovePdf(key: string) {
    sessionStorage.removeItem(`pdfMeta_${key}`);
    sessionStorage.removeItem(`mindMapData_${key}`);
    // Remove active key if needed
    setActivePdfKey(prev => prev === key ? null : prev);
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
            onTabChange={setActivePdfKey}
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
