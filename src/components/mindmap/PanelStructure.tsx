import { useRef, useState, useEffect } from "react";
import PdfTabs, { getAllPdfs, getPdfKey, PdfMeta } from "@/components/PdfTabs";
import PdfViewer from "@/components/PdfViewer";
import MindMapViewer from "@/components/MindMapViewer";
import ChatPanel from "@/components/mindmap/ChatPanel";
import MobileChatSheet from "@/components/mindmap/MobileChatSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { storePdfData, setCurrentPdf, getPdfData, clearPdfData, isMindMapReady, preloadPdfCache } from "@/utils/pdfStorage";
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
  isSnapshotMode?: boolean; // Add new prop
  setIsSnapshotMode?: (isActive: boolean) => void; // Add new prop
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
  isSnapshotMode = false, // Default to false
  setIsSnapshotMode = () => {}, // Default noop function
}: PanelStructureProps) => {
  const isMapGenerated = true;
  const pdfViewerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  
  const [isLoadingMindMap, setIsLoadingMindMap] = useState(false);
  const { toast } = useToast();
  
  // Updated state for captured image with flag to prevent double processing
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingCapture, setProcessingCapture] = useState(false);

  // PDF tab state (active key)
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  // File input for adding PDFs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preload PDF cache on component mount
  useEffect(() => {
    preloadPdfCache().catch(err => 
      console.error("Error preloading PDF cache:", err)
    );
  }, []);

  // Handle active PDF change - optimized for instant loading
  const handleTabChange = async (key: string) => {
    try {
      // Update the active key immediately for UI response
      setActivePdfKey(key);
      
      // Set as current in IndexedDB - doesn't block UI
      setCurrentPdf(key).catch(error => 
        console.error("Error setting current PDF:", error)
      );
      
      // Check if PDF data exists (from cache first, then IndexedDB)
      const pdfDataExists = await getPdfData(key);
      
      if (!pdfDataExists) {
        // If PDF data doesn't exist in storage but we have meta in sessionStorage
        toast({
          title: "PDF Data Missing",
          description: "PDF data not found. You may need to re-upload this PDF.",
          variant: "destructive",
        });
        
        // Remove the orphaned PDF metadata
        sessionStorage.removeItem(`pdfMeta_${key}`);
        sessionStorage.removeItem(`mindMapData_${key}`);
        sessionStorage.removeItem(`mindMapReady_${key}`);
        
        // Try to find another PDF to switch to
        const metas = getAllPdfs();
        if (metas.length > 0 && getPdfKey(metas[0]) !== key) {
          // Switch to another available PDF
          setActivePdfKey(getPdfKey(metas[0]));
          await setCurrentPdf(getPdfKey(metas[0]));
          window.dispatchEvent(new CustomEvent('pdfListUpdated'));
        } else if (metas.length === 0) {
          // No PDFs left
          setActivePdfKey(null);
        }
        
        return;
      }
      
      // Only show loading if this is a newly added PDF without a generated mindmap yet
      if (!isMindMapReady(key)) {
        setIsLoadingMindMap(true);
      }
      
      // Notify components about PDF switch
      window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey: key } }));
      
      // Only display the toast for switching if we're not loading a new mindmap
      if (isMindMapReady(key)) {
        toast({
          title: "PDF Loaded",
          description: "PDF and mindmap switched successfully.",
        });
      }

      // Give some time for the mindmap to load before removing loading state
      // Only needed for newly added PDFs
      if (!isMindMapReady(key)) {
        setTimeout(() => {
          setIsLoadingMindMap(false);
        }, 500);
      }
    } catch (error) {
      console.error("Error switching PDF:", error);
      setIsLoadingMindMap(false);
      toast({
        title: "Error Switching PDF",
        description: "Failed to switch to the selected PDF. The PDF may be missing.",
        variant: "destructive",
      });
    }
  };

  // Remove pdf logic
  function handleRemovePdf(key: string) {
    // First remove from IndexedDB
    clearPdfData(key)
      .then(() => {
        // Then remove from session storage
        sessionStorage.removeItem(`pdfMeta_${key}`);
        sessionStorage.removeItem(`mindMapData_${key}`);
        sessionStorage.removeItem(`mindMapReady_${key}`);
        sessionStorage.removeItem(`pdfText_${key}`);
        
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
      })
      .catch(error => {
        console.error("Error removing PDF data:", error);
        toast({
          title: "Error",
          description: "Failed to completely remove the PDF data.",
          variant: "destructive",
        });
      });
  }

  // Generate Mindmap after extracting PDF text - optimized for performance
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
      
      // Start the loading animation - NEW PDF is being added
      setIsLoadingMindMap(true);
      
      // Store meta in sessionStorage
      sessionStorage.setItem(
        `pdfMeta_${pdfKey}`,
        JSON.stringify({ name: file.name, size: file.size, lastModified: file.lastModified })
      );
      
      try {
        // Read and process PDF file as dataURL - in parallel with text extraction
        const reader = new FileReader();
        
        const pdfDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject();
          reader.readAsDataURL(file);
        });
        
        // Start text extraction in parallel with reading the PDF data
        const textExtractionPromise = PdfToText(file);
        
        // Wait for PDF data to be read
        const pdfData = await pdfDataPromise;
        
        // Store PDF data in cache and IndexedDB immediately - don't block UI
        storePdfData(pdfKey, pdfData)
          .then(() => console.log(`PDF data stored for: ${file.name}`))
          .catch(err => console.error("Error storing PDF data:", err));
        
        // Get the extracted text result
        const extractedText = await textExtractionPromise;
        
        if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
          toast({
            title: "No extractable text",
            description: "This PDF appears to be image-based or scanned.",
            variant: "destructive"
          });
          setIsLoadingMindMap(false);
          continue;
        }
        
        // IMPORTANT: Store extracted text separately for each PDF
        sessionStorage.setItem(`pdfText_${pdfKey}`, extractedText);
        
        // Also set as current PDF text for backward compatibility
        sessionStorage.setItem('pdfText', extractedText);
        
        // Generate mindmap data
        const mindMapData = await generateMindMapFromText(extractedText);
        sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(mindMapData));
        sessionStorage.setItem(`mindMapReady_${pdfKey}`, 'true');
        
        // Optionally, select this tab
        setActivePdfKey(pdfKey);
        await setCurrentPdf(pdfKey); // Set as current PDF
        window.dispatchEvent(new CustomEvent('pdfListUpdated'));
        window.dispatchEvent(new CustomEvent('pdfSwitched', { detail: { pdfKey } }));
        setIsLoadingMindMap(false);
        toast({
          title: "Success",
          description: "Mind map generated and PDF added!",
        });
      } catch (err) {
        console.error("Error processing PDF:", err);
        setIsLoadingMindMap(false);
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

  // Handle image captured from PDF viewer
  const handleImageCaptured = (imageData: string) => {
    // Exit if we're currently processing an image to prevent duplicates
    if (processingCapture) return;
    
    // Set processing flag to true to prevent duplicate captures
    setProcessingCapture(true);
    
    // Store the image data
    setCapturedImage(imageData);
    
    // Open chat panel if not already open - ALWAYS open chat when capturing image
    if (!showChat) {
      toggleChat();
    }
    
    // Dispatch event to send image to chat
    window.dispatchEvent(
      new CustomEvent('openChatWithImage', { detail: { imageData } })
    );
    
    // Signal that capture was successful to update UI - use inPdf flag to ensure rectangle stays visible
    window.dispatchEvent(
      new CustomEvent('captureDone', { detail: { success: true, inPdf: true } })
    );
    
    // Reset processing flag after a delay to prevent rapid successive captures
    setTimeout(() => {
      setProcessingCapture(false);
    }, 1500); // Increased timeout to prevent issues
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRendered(true);
    }, 50); // Reduced from 100ms to 50ms for faster rendering

    return () => {
      clearTimeout(timer);
      setIsRendered(false);
    };
  }, []);

  // Enhanced event listener for opening chat with text - ALWAYS open chat
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      // Always open chat when text is selected for explanation
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

  // Improved event handler to handle openChatWithImage event
  useEffect(() => {
    const handleOpenChatWithImage = (event: CustomEvent) => {
      // Only process if we're not already handling an image capture
      if (processingCapture) return;
      
      if (event.detail?.imageData) {
        setProcessingCapture(true);
        setCapturedImage(event.detail.imageData);
        
        // Always open chat when image is captured
        if (!showChat) {
          toggleChat();
        }
        
        // Reset processing flag after a delay
        setTimeout(() => {
          setProcessingCapture(false);
        }, 1000); // Reduced to 1000ms for faster responses
      }
    };
    
    // Add event listener with correct typing
    window.addEventListener('openChatWithImage', handleOpenChatWithImage as EventListener);
    
    return () => {
      window.removeEventListener('openChatWithImage', handleOpenChatWithImage as EventListener);
    };
  }, [showChat, toggleChat, processingCapture]);

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

  useEffect(() => {
    if (isSnapshotMode) {
      // When snapshot mode is enabled, ensure PDF is visible
      if (!showPdf) {
        togglePdf();
      }
    }
  }, [isSnapshotMode, showPdf, togglePdf]);

  if (!isRendered) {
    return <div className="h-full w-full flex justify-center items-center">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
        <p>Loading panels...</p>
      </div>
    </div>;
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
                onImageCaptured={handleImageCaptured}
                highlightByDefault={true} // Enable text highlighting by default
                isSnapshotMode={isSnapshotMode} // Pass snapshot mode
                onExitSnapshotMode={() => setIsSnapshotMode(false)} // Allow exiting
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
            isLoading={isLoadingMindMap}
          />
        </div>

        {showChat && (
          <div className="h-full w-[30%] flex-shrink-0">
            <ChatPanel
              toggleChat={toggleChat}
              explainText={explainText}
              explainImage={capturedImage}
              onExplainText={onExplainText}
              onScrollToPdfPosition={handleScrollToPdfPosition}
            />
          </div>
        )}

        <MobileChatSheet 
          onScrollToPdfPosition={handleScrollToPdfPosition}
          explainText={explainText}
          explainImage={capturedImage}
        />
      </div>
    </>
  );
};

export default PanelStructure;
