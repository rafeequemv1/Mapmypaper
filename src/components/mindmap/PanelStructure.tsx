import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData, setCurrentPdf, getAllPdfKeys, storePdfText, getPdfText } from "@/utils/pdfStorage";
import PdfToText from "react-pdftotext";
import { generateMindMapFromText } from "@/services/geminiService";
import { useNavigate } from "react-router-dom";
import { Home, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface PanelStructureProps {
  showPdf: boolean;
  showChat: boolean;
  toggleChat: () => void;
  togglePdf: () => void;
  onMindMapReady: any;
  explainText: string;
  explainImage?: string | null;
  onExplainText: (text: string) => void;
  onTextSelected: (text: string) => void;
  onImageCaptured?: (imageData: string) => void;
  activePdfKey: string | null;
  onActivePdfKeyChange: (key: string | null) => void;
  pdfLoadError?: string | null;
}

const mindMapKeyPrefix = "mindMapData_";

const PanelStructure = ({
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
  onActivePdfKeyChange,
  pdfLoadError,
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
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch all PDF keys on mount
  useEffect(() => {
    const fetchPdfKeys = async () => {
      console.log("Fetching PDF keys...");
      try {
        const keys = await getAllPdfKeys();
        console.log("Retrieved PDF keys:", keys);
        setAllPdfKeys(keys);
        
        // If we have keys but no active key, set the first one as active
        if (keys.length > 0 && !activePdfKey) {
          console.log("Setting first key as active:", keys[0]);
          onActivePdfKeyChange(keys[0]);
          await setCurrentPdf(keys[0]);
        }
      } catch (error) {
        console.error("Error fetching PDF keys:", error);
      }
    };
    fetchPdfKeys();
  }, [activePdfKey, onActivePdfKeyChange]);

  // Handle active PDF change
  const handleTabChange = async (key: string) => {
    try {
      console.log("Changing to PDF key:", key);
      onActivePdfKeyChange(key);
      
      // Set the selected PDF as current in IndexedDB
      await setCurrentPdf(key);
      
      window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: key } }));
      toast({
        title: "PDF Loaded",
        description: "PDF and mindmap switched successfully.",
      });
      setPdfLoaded(true);
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
    console.log("Removing PDF with key:", key);
    sessionStorage.removeItem(`pdfMeta_${key}`);
    sessionStorage.removeItem(`mindMapData_${key}`);
    sessionStorage.removeItem(`hasPdfData_${key}`);
    sessionStorage.removeItem(`pdfText_${key}`);
    const metas = getAllPdfs();
    if (activePdfKey === key) {
      if (metas.length > 0) {
        handleTabChange(getPdfKey(metas[0]));
      } else {
        onActivePdfKeyChange(null);
        setPdfLoaded(false);
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
          reader.onerror = () => reject(new Error("Failed to read PDF file"));
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
        let extractedText;
        try {
          extractedText = await PdfToText(file);
          
          if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
            toast({
              title: "No extractable text",
              description: "This PDF appears to be image-based or scanned.",
              variant: "destructive"
            });
            continue;
          }
          
          // Store the extracted text
          await storePdfText(pdfKey, extractedText);
        } catch (textError) {
          console.error("Error extracting text from PDF:", textError);
          toast({
            title: "Text Extraction Failed",
            description: "Failed to extract text from the PDF.",
            variant: "destructive"
          });
          continue;
        }
        
        // Generate mindmap data
        setProcessingProgress(80);
        setProcessingStage("Generating mind map");
        try {
          const mindMapData = await generateMindMapFromText(extractedText);
          sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(mindMapData));
        } catch (mapError) {
          console.error("Error generating mind map:", mapError);
          toast({
            title: "Mind Map Generation Failed",
            description: "Could not generate mind map, but PDF was added.",
            variant: "warning"
          });
          // Continue despite error - we can try to regenerate later
        }
        
        // Update the list of all PDF keys
        const updatedKeys = await getAllPdfKeys();
        setAllPdfKeys(updatedKeys);
        
        // Optionally, select this tab
        onActivePdfKeyChange(pdfKey);
        await setCurrentPdf(pdfKey); // Set as current PDF
        setPdfLoaded(true);
        
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
  
  const handleRetryMindMap = async () => {
    if (!activePdfKey) {
      toast({
        title: "No PDF Selected",
        description: "Please select a PDF first.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingPdfKey(activePdfKey);
    setProcessingProgress(50);
    setProcessingStage("Regenerating mind map");
    setRetryCount(prev => prev + 1);
    
    try {
      // Get the PDF text
      const pdfText = await getPdfText(activePdfKey);
      
      if (!pdfText || pdfText.trim() === "") {
        toast({
          title: "No PDF Text",
          description: "No extractable text found for this PDF.",
          variant: "destructive",
        });
        setProcessingPdfKey(null);
        return;
      }
      
      // Generate a new mind map
      const mindMapData = await generateMindMapFromText(pdfText);
      
      // Store the new mind map
      sessionStorage.setItem(`${mindMapKeyPrefix}${activePdfKey}`, JSON.stringify(mindMapData));
      
      // Trigger an update event
      window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: activePdfKey } }));
      
      setProcessingProgress(100);
      setProcessingStage("Complete");
      
      toast({
        title: "Mind Map Regenerated",
        description: "Mind map has been successfully regenerated.",
      });
      
      // Reset processing state after a short delay
      setTimeout(() => {
        setProcessingPdfKey(null);
        setProcessingProgress(0);
        setProcessingStage("");
      }, 1000);
    } catch (error) {
      console.error("Error regenerating mind map:", error);
      setProcessingPdfKey(null);
      setProcessingProgress(0);
      setProcessingStage("");
      
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate mind map.",
        variant: "destructive",
      });
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

  // Handle area image capture
  const handlePdfAreaCaptured = (imageData: string) => {
    if (onImageCaptured) {
      onImageCaptured(imageData);
    }
    
    // If chat is not showing, toggle it on
    if (!showChat) {
      toggleChat();
    }
  };

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

  const handlePdfLoaded = () => {
    console.log("PDF loaded callback");
    setPdfLoaded(true);
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
                onImageCaptured={handlePdfAreaCaptured}
                onPdfLoaded={handlePdfLoaded}
              />
            </TooltipProvider>
          </div>
        )}

        {/* Mind Map Panel - Takes up remaining space */}
        <div className={`h-full ${showPdf ? (showChat ? 'w-[30%]' : 'w-[60%]') : (showChat ? 'w-[70%]' : 'w-full')}`}>
          {pdfLoadError ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading PDF</h2>
                <p className="text-red-600 mb-6">{pdfLoadError}</p>
                <div className="flex flex-col gap-3">
                  <Button onClick={handlePlusClick} className="w-full">
                    Upload a New PDF
                  </Button>
                  <Button onClick={handleRetryMindMap} variant="outline" className="w-full">
                    Retry Mind Map Generation
                  </Button>
                </div>
              </div>
            </div>
          ) : !activePdfKey ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md text-center">
                <h2 className="text-xl font-bold text-blue-700 mb-2">No PDF Selected</h2>
                <p className="text-blue-600 mb-6">
                  Please upload a PDF file to view and analyze it.
                </p>
                <Button onClick={handlePlusClick}>
                  Upload PDF
                </Button>
              </div>
            </div>
          ) : (
            <MindMapViewer
              isMapGenerated={isMapGenerated}
              onMindMapReady={onMindMapReady}
              onExplainText={onExplainText}
              pdfKey={activePdfKey}
              onError={() => {
                // If mind map generation fails, offer to retry
                if (retryCount === 0) {
                  toast({
                    title: "Mind Map Error",
                    description: "Failed to load mind map. Try regenerating it.",
                    duration: 5000,
                  });
                  handleRetryMindMap();
                }
              }}
            />
          )}
        </div>

        {showChat && (
          <div className="h-full w-[30%] flex-shrink-0">
            <ChatPanel
              toggleChat={toggleChat}
              explainText={explainText}
              explainImage={explainImage}
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
