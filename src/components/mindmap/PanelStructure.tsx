
import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData } from "@/utils/pdfStorage";
import PdfToText from "react-pdftotext";
import { generateMindMapFromText } from "@/services/geminiService";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
}

const mindMapKeyPrefix = "mindMapData_";

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

  // File input for adding PDFs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle active PDF change
  const handleTabChange = async (key: string) => {
    try {
      setActivePdfKey(key);
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
      await storePdfData(pdfData);
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
    sessionStorage.removeItem(`pdfMeta_${key}`);
    sessionStorage.removeItem(`mindMapData_${key}`);
    sessionStorage.removeItem(`pdfData_${key}`);
    const metas = getAllPdfs();
    if (activePdfKey === key) {
      if (metas.length > 0) {
        handleTabChange(getPdfKey(metas[0]));
      } else {
        setActivePdfKey(null);
      }
    }
    window.dispatchEvent(new CustomEvent('pdfListUpdated'));
    toast({
      title: "PDF Removed",
      description: "The PDF has been removed.",
    });
  }

  // Generate Mindmap after extracting PDF text
  async function handleAddPdf(files: FileList | null) {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    if (!pdfFiles.length) {
      toast({
        title: "Invalid file(s)",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }
    for (const file of pdfFiles) {
      const pdfKey = getPdfKey({ name: file.name, size: file.size, lastModified: file.lastModified });
      // Prevent duplicates
      if (sessionStorage.getItem(`pdfMeta_${pdfKey}`)) {
        toast({ title: "Already added", description: `PDF "${file.name}" already exists.` });
        continue;
      }
      // Store meta in sessionStorage
      sessionStorage.setItem(
        `pdfMeta_${pdfKey}`,
        JSON.stringify({ name: file.name, size: file.size, lastModified: file.lastModified })
      );
      try {
        // Read and process PDF file as dataURL
        const reader = new FileReader();
        const pdfDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject();
          reader.readAsDataURL(file);
        });
        const pdfData = await pdfDataPromise;
        await storePdfData(pdfData);
        sessionStorage.setItem(`pdfData_${pdfKey}`, pdfData);
        // Extract text from PDF
        const extractedText = await PdfToText(file);
        if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
          toast({
            title: "No extractable text",
            description: "This PDF appears to be image-based or scanned.",
            variant: "destructive"
          });
          continue;
        }
        // Generate mindmap data
        const mindMapData = await generateMindMapFromText(extractedText);
        sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(mindMapData));
        // Optionally, select this tab
        setActivePdfKey(pdfKey);
        await storePdfData(pdfData); // Refresh viewer as well
        window.dispatchEvent(new CustomEvent('pdfListUpdated'));
        window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey } }));
        toast({
          title: "Success",
          description: "Mind map generated and PDF added!",
        });
      } catch (err) {
        toast({
          title: "Failed to process PDF",
          description: "Could not process the selected PDF.",
          variant: "destructive",
        });
      }
    }
  }

  const handlePlusClick = () => {
    // Open file dialog
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset for re-uploading same file
      fileInputRef.current.click();
    }
  };

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
      if (!showChat) {
        toggleChat();
      }
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
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => handleAddPdf(e.target.files)}
      />
      <div className="h-full w-full flex pl-12">
        {/* PDF Panel - Fixed to 40% width */}
        {showPdf && (
          <div className="h-full w-[40%] flex-shrink-0 flex flex-col">
            {/* PDF tabs above viewer */}
            <PdfTabs
              activeKey={activePdfKey}
              onTabChange={handleTabChange}
              onRemove={handleRemovePdf}
              onAddPdf={handlePlusClick} // The plus
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
    </>
  );
};

export default PanelStructure;

