
import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData, setCurrentPdf, getAllPdfKeys, getPdfText } from "@/utils/pdfStorage";
import PdfToText from "react-pdftotext";
import { generateMindMapFromText } from "@/services/geminiService";
import { useNavigate } from "react-router-dom";
import { Home, Loader2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  onApiStatusChange?: (status: 'idle' | 'loading' | 'error' | 'success') => void;
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
  onImageCaptured,
  activePdfKey,
  onActivePdfKeyChange,
  onApiStatusChange,
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
  const [apiError, setApiError] = useState<string | null>(null);

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
      
      // Check if the mindmap data already exists for this PDF
      const mindmapData = sessionStorage.getItem(`${mindMapKeyPrefix}${key}`);
      if (!mindmapData) {
        // Try to generate the mindmap if it doesn't exist
        try {
          const pdfText = await getPdfText(key);
          if (pdfText && pdfText.length > 0) {
            setProcessingPdfKey(key);
            setProcessingStage("Generating mindmap");
            setProcessingProgress(50);
            if (onApiStatusChange) onApiStatusChange('loading');
            
            const mindMapData = await generateMindMapFromText(pdfText);
            sessionStorage.setItem(`${mindMapKeyPrefix}${key}`, JSON.stringify(mindMapData));
            
            setProcessingProgress(100);
            setProcessingStage("Complete");
            if (onApiStatusChange) onApiStatusChange('success');
            
            setTimeout(() => {
              setProcessingPdfKey(null);
              setProcessingProgress(0);
              setProcessingStage("");
            }, 500);
          }
        } catch (error) {
          console.error("Error generating mindmap for existing PDF:", error);
          setApiError(error.message || "Failed to generate mindmap");
          if (onApiStatusChange) onApiStatusChange('error');
          
          // Create a default mindmap so something is displayed
          const defaultMindMap = {
            nodeData: {
              id: 'root',
              topic: '📄 Document Analysis',
              children: [
                {
                  id: 'error1',
                  topic: '⚠️ Could not generate mindmap from document content.',
                  direction: 0,
                  children: [
                    { id: 'error1-1', topic: 'API error or connection issue prevented mindmap generation.' }
                  ]
                },
                {
                  id: 'suggest1',
                  topic: '💡 Use the chat to ask questions about the document.',
                  direction: 0
                }
              ]
            }
          };
          
          sessionStorage.setItem(`${mindMapKeyPrefix}${key}`, JSON.stringify(defaultMindMap));
          
          toast({
            title: "Mindmap Generation Failed",
            description: "Couldn't create a complete mindmap for this PDF. Using a basic structure instead.",
            variant: "destructive",
          });
        }
      }
      
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
    
    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "Gemini API key is required to generate mindmaps. Please set it in your .env file.",
        variant: "destructive",
      });
      setApiError("Missing API key");
      if (onApiStatusChange) onApiStatusChange('error');
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
        // Reset any previous errors
        setApiError(null);
        if (onApiStatusChange) onApiStatusChange('loading');
        
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
        const extractedText = await PdfToText(file);
        
        // Store extracted text in sessionStorage for quick access
        if (extractedText && typeof extractedText === "string") {
          sessionStorage.setItem(`pdfText_${pdfKey}`, extractedText);
        }
        
        if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
          toast({
            title: "No extractable text",
            description: "This PDF appears to be image-based or scanned.",
            variant: "destructive"
          });
          
          // Create a basic mindmap for image-based PDFs
          const basicMindmap = {
            nodeData: {
              id: "root",
              topic: `📄 ${file.name}`,
              children: [
                {
                  id: "img1",
                  topic: "🖼️ Image-based PDF",
                  direction: 0,
                  children: [
                    { id: "img1-1", topic: "This appears to be a scanned document or image-based PDF" },
                    { id: "img1-2", topic: "Text extraction not possible" },
                    { id: "img1-3", topic: "Try using the area selection tool to capture diagrams" }
                  ]
                }
              ]
            }
          };
          
          sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(basicMindmap));
          setProcessingProgress(100);
          setProcessingStage("Complete");
          continue;
        }
        
        // Generate mindmap data
        setProcessingProgress(80);
        setProcessingStage("Generating mind map");
        console.log("Sending PDF text to Gemini API for mindmap generation");
        
        const mindMapData = await generateMindMapFromText(extractedText);
        console.log("Received mindmap data from API:", mindMapData ? "success" : "failed");
        
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
        
        if (onApiStatusChange) onApiStatusChange('success');
        
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
      } catch (err: any) {
        console.error("Error processing PDF:", err);
        setProcessingPdfKey(null);
        setProcessingProgress(0);
        setProcessingStage("");
        setApiError(err.message || "Unknown API error");
        
        if (onApiStatusChange) onApiStatusChange('error');
        
        toast({
          title: "Failed to process PDF",
          description: `Error: ${err.message || "Could not generate mindmap"}`,
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
        
        {/* API Error Alert */}
        {apiError && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
            <Alert variant="destructive" className="border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription>
                {apiError}. Please check your Gemini API key and internet connection.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
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
                  {processingStage === "Generating mind map" 
                    ? "Analyzing document content with AI. This may take a minute..."
                    : "Please wait while we process your document. This may take a minute depending on the file size."}
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
            onRequestOpenChat={toggleChat}
            pdfKey={activePdfKey}
          />
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
