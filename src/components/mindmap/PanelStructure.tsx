
import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData, setCurrentPdf, getAllPdfKeys } from "@/utils/pdfStorage";
import PdfToText from "react-pdftotext";
import { generateMindMapFromText } from "@/services/geminiService";
import { useNavigate } from "react-router-dom";
import { Home, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  onExplainText: (text: string) => void;
  activePdfKey: string | null;
  onActivePdfKeyChange: (key: string | null) => void;
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
  activePdfKey,
  onActivePdfKeyChange,
}: PanelStructureProps) => {
  const isMapGenerated = true;
  const pdfViewerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // PDF tab state (active key)
  const [allPdfKeys, setAllPdfKeys] = useState<string[]>([]);
  
  // Processing state for PDFs
  const [processingPdfKey, setProcessingPdfKey] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  // Fetch all PDF keys on mount
  useEffect(() => {
    const fetchPdfKeys = async () => {
      const keys = await getAllPdfKeys();
      setAllPdfKeys(keys);
    };
    fetchPdfKeys();
  }, []);

  // Handle active PDF change
  const handleTabChange = async (key: string) => {
    try {
      onActivePdfKeyChange(key);
      
      // Set the selected PDF as current in IndexedDB
      await setCurrentPdf(key);
      
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
    sessionStorage.removeItem(`hasPdfData_${key}`);
    const metas = getAllPdfs();
    if (activePdfKey === key) {
      if (metas.length > 0) {
        handleTabChange(getPdfKey(metas[0]));
      } else {
        onActivePdfKeyChange(null);
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
        // Set processing state
        setProcessingPdfKey(pdfKey);
        setProcessingProgress(0);
        setProcessingStage("Reading PDF");
        
        // Read and process PDF file as dataURL
        const reader = new FileReader();
        const pdfDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject();
          reader.readAsDataURL(file);
        });
        
        setProcessingProgress(20);
        const pdfData = await pdfDataPromise;
        
        // Store PDF data in IndexedDB only, not in sessionStorage
        setProcessingProgress(40);
        setProcessingStage("Storing PDF");
        await storePdfData(pdfKey, pdfData);
        
        // Extract text from PDF
        setProcessingProgress(60);
        setProcessingStage("Extracting text");
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
        setProcessingProgress(80);
        setProcessingStage("Generating mind map");
        const mindMapData = await generateMindMapFromText(extractedText);
        
        sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(mindMapData));
        
        // Update the list of all PDF keys
        const updatedKeys = await getAllPdfKeys();
        setAllPdfKeys(updatedKeys);
        
        // Optionally, select this tab
        onActivePdfKeyChange(pdfKey);
        await setCurrentPdf(pdfKey); // Set as current PDF
        
        setProcessingProgress(100);
        setProcessingStage("Complete");
        
        window.dispatchEvent(new CustomEvent('pdfListUpdated'));
        window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey } }));
        
        toast({
          title: "Success",
          description: "Mind map generated and PDF added!",
        });
        
        // Reset processing state after a short delay to show completion
        setTimeout(() => {
          setProcessingPdfKey(null);
          setProcessingProgress(0);
          setProcessingStage("");
        }, 1000);
      } catch (err) {
        console.error("Error processing PDF:", err);
        setProcessingPdfKey(null);
        setProcessingProgress(0);
        setProcessingStage("");
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        {/* Toolbar at the top left */}
        <div className="fixed top-3 left-3 z-40 flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center p-2"
            aria-label="Home"
          >
            <Home className="h-6 w-6 text-primary" />
          </button>
        </div>
        
        {/* Loading overlay for processing PDFs */}
        {processingPdfKey && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
              <h3 className="text-lg font-medium mb-4">Processing PDF</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="font-medium">{processingStage}</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
                
                <p className="text-sm text-gray-500">
                  Please wait while we process your document. This may take a minute depending on the file size.
                </p>
              </div>
            </div>
          </div>
        )}
        
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
              onPdfPlusClick={handlePlusClick}
              activePdfKey={activePdfKey}
              allPdfKeys={allPdfKeys}
            />
          </div>
        )}

        <MobileChatSheet 
          onScrollToPdfPosition={handleScrollToPdfPosition}
          explainText={explainText}
          activePdfKey={activePdfKey}
          allPdfKeys={allPdfKeys}
        />
      </div>
    </>
  );
};

export default PanelStructure;
