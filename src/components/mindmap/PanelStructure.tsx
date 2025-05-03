
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import PdfViewer from "@/components/mindmap/PdfViewer";
import MindMapComponent from "@/components/mindmap/MindMapComponent";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MessageEmpty from "@/components/mindmap/MessageEmpty";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: (instance: any) => void;
  explainText?: string;
  explainImage?: string;
  onExplainText: (text: string) => void;
  onTextSelected: (text: string) => void;
  onImageCaptured: (imageData: string) => void;
  activePdfKey: string | null;
  onActivePdfKeyChange: (pdfKey: string | null) => void;
}

// Add this function to get PDF keys from session storage
function getAllPdfKeysFromSession(): string[] {
  return Object.keys(sessionStorage)
    .filter(key => key.startsWith('mindMapData_'))
    .map(key => key.replace('mindMapData_', ''));
}

const PanelStructure: React.FC<PanelStructureProps> = ({
  showPdf,
  showChat,
  toggleChat,
  togglePdf,
  onMindMapReady,
  explainText,
  explainImage,
  onExplainText,
  onTextSelected,
  onImageCaptured,
  activePdfKey,
  onActivePdfKeyChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  const handleScrollToPdfPosition = useCallback((position: string) => {
    setScrollTo(position);
    setTimeout(() => {
      setScrollTo(null);
    }, 500);
  }, []);
  
  const [allPdfKeys, setAllPdfKeys] = useState<string[]>([]);
  
  // Get all PDF keys on mount
  useEffect(() => {
    const keys = getAllPdfKeysFromSession();
    setAllPdfKeys(keys);
  }, []);
  
  // Update all PDF keys when active PDF changes
  useEffect(() => {
    if (activePdfKey) {
      const keys = getAllPdfKeysFromSession();
      setAllPdfKeys(keys);
    }
  }, [activePdfKey]);

  return (
    <div className="flex flex-1 relative overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* Left panel (PDF viewer) */}
        <ResizablePanel
          defaultSize={50}
          minSize={10}
          maxSize={90}
          collapsible={false}
          collapsedSize={0}
          className={cn(!showPdf && "hidden", "transition-all duration-300")}
        >
          <PdfViewer
            onTextSelected={onTextSelected}
            onImageCaptured={onImageCaptured}
            scrollTo={scrollTo}
            pdfKey={activePdfKey}
            onPdfKeyChange={onActivePdfKeyChange}
          />
        </ResizablePanel>

        {/* Middle panel (mind map) */}
        <ResizablePanel defaultSize={50} minSize={10}>
          <MindMapComponent
            onMindMapReady={onMindMapReady}
            isMapGenerated={isMapGenerated}
            pdfKey={activePdfKey}
          />
        </ResizablePanel>
        
        {/* Right panel (chat) */}
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={50}
          collapsible={false}
          collapsedSize={0}
          className={cn(!showChat && "hidden", "transition-all duration-300")}
        >
          <ChatPanel
            toggleChat={toggleChat}
            explainText={explainText}
            explainImage={explainImage}
            onScrollToPdfPosition={handleScrollToPdfPosition}
            onExplainText={onExplainText}
            activePdfKey={activePdfKey}
            allPdfKeys={allPdfKeys}
            onPdfPlusClick={() => navigate('/')} // Navigate to upload page
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default PanelStructure;
