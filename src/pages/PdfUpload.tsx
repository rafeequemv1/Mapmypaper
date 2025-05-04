import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, Upload, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import { storePdfData, setCurrentPdf } from "@/utils/pdfStorage";
import Logo from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function getPdfKey(file: File) {
  // You could enhance this by hashing the file if needed, but name+size+lastModified is a good-enough ID for most use-cases.
  return `${file.name}_${file.size}_${file.lastModified}`;
}

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [activePdfKey, setActivePdfKey] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const maxRetries = 3;
  const retryDelay = 15000; // 15 seconds
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Keep all mindMap data by pdfKey in sessionStorage
  const mindMapKeyPrefix = "mindMapData_";

  useEffect(() => {
    // On mount, load PDFs list and last active from sessionStorage
    const keys = Object.keys(sessionStorage)
      .filter((k) => k.startsWith(mindMapKeyPrefix))
      .map((k) => k.replace(mindMapKeyPrefix, ""));
    const filesData: { name: string; size: number; lastModified: number; }[] = keys
      .map((key) => {
        try {
          return JSON.parse(sessionStorage.getItem(`pdfMeta_${key}`) || "");
        } catch { return null }
      })
      .filter((item): item is { name: string; size: number; lastModified: number } => !!item);

    // We can't reconstruct actual File objects on reload, so only previously selected files within current session are restored.
    // On new uploads, this will be set and fully functional.
    // This example doesn't persist the full File object - could be improved with real backend!
    // On fresh mount: pdfFiles is empty.
    if (window.__PDF_FILES__ && window.__PDF_FILES__.length > 0) {
      setPdfFiles(window.__PDF_FILES__);
      setActivePdfKey(window.__ACTIVE_PDF_KEY__ || null);
    } else {
      setPdfFiles([]);
      setActivePdfKey(null);
    }
    // Clear pending ops
    pendingFileRef.current = null;
  }, []);

  // Helper to persist active file state (for demonstration - not real persistence)
  useEffect(() => {
    window.__PDF_FILES__ = pdfFiles;
    window.__ACTIVE_PDF_KEY__ = activePdfKey;
  }, [pdfFiles, activePdfKey]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleMultipleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      handleMultipleFiles(Array.from(e.target.files));
    }
  }, []);

  function handleMultipleFiles(files: File[]) {
    const validPdfs = files.filter((f) => f.type === "application/pdf");
    if (!validPdfs.length) {
      toast({
        title: "Invalid file(s)",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }
    // Prevent duplicates (by name/size/lastModified)
    const existingKeys = new Set(pdfFiles.map(getPdfKey));
    const newPdfs = validPdfs.filter(f => !existingKeys.has(getPdfKey(f)));
    if (!newPdfs.length) {
      toast({
        title: "All PDFs already added",
        description: "These PDFs are already in your session.",
      });
      return;
    }

    const newList = [...pdfFiles, ...newPdfs];
    setPdfFiles(newList);
    setActivePdfKey(getPdfKey(newPdfs[0]));

    // Store file meta for restored sessions (demo only)
    newPdfs.forEach(file => {
      sessionStorage.setItem(`pdfMeta_${getPdfKey(file)}`, JSON.stringify({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      }));
    });

    toast({
      title: "PDFs uploaded",
      description: `${newPdfs.length} PDF${newPdfs.length===1?'':'s'} added.`,
    });
  }

  // Remove PDF from list and storage
  const removePdf = (key: string) => {
    const idx = pdfFiles.findIndex(f => getPdfKey(f) === key);
    if (idx === -1) return;
    const updatedPdfs = pdfFiles.filter((f, i) => i !== idx);
    setPdfFiles(updatedPdfs);

    sessionStorage.removeItem(`${mindMapKeyPrefix}${key}`);
    sessionStorage.removeItem(`pdfMeta_${key}`);

    // Switch active tab if needed
    if (activePdfKey === key) {
      setActivePdfKey(updatedPdfs.length ? getPdfKey(updatedPdfs[0]) : null);
    }
  };

  // Core PDF processing for active tab/file
  const handleGenerateMindmap = useCallback(async () => {
    if (!activePdfKey) {
      toast({
        title: "No PDF selected",
        description: "Please add and select a PDF file.",
        variant: "destructive",
      });
      return;
    }
    const selectedFile = pdfFiles.find(f => getPdfKey(f) === activePdfKey);
    if (!selectedFile) return;

    setIsProcessing(true);
    setExtractionError(null);
    setRetryAttempt(0);

    toast({
      title: "Processing PDF",
      description: "Extracting text and generating mind map...",
    });

    await processAndGenerateMindMap(selectedFile, activePdfKey);
  // eslint-disable-next-line
  }, [activePdfKey, pdfFiles, toast]);  

  async function processAndGenerateMindMap(selectedFile: File, pdfKey: string) {
    try {
      // Read the PDF as DataURL for viewing (same as before)
      const reader = new FileReader();

      const pdfDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          const base64data = e.target?.result as string;
          if (!base64data) return reject(new Error("Failed to read PDF file"));
          resolve(base64data);
        };
        reader.onerror = () => reject(new Error("Error reading PDF file"));
        reader.readAsDataURL(selectedFile as File);
      });

      // Store the PDF data in IndexedDB with its unique key
      const pdfData = await pdfDataPromise;
      
      // Store in IndexedDB with the specific key
      await storePdfData(pdfKey, pdfData);
      
      // Also set as current active PDF
      await setCurrentPdf(pdfKey);
      
      console.log(`PDF data stored for: ${selectedFile.name}`);

      // Extract text
      const extractedText = await PdfToText(selectedFile);

      if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
        throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
      }

      // Store the extracted text in session storage
      if (extractedText) {
        try {
          // Import the storePdfText function
          const { storePdfText } = await import('@/utils/pdfStorage');
          storePdfText(pdfKey, extractedText);
        } catch (error) {
          console.warn('Failed to store PDF text in session storage:', error);
        }
      }
      
      // Process via Gemini API
      try {
        const mindMapData = await generateMindMapFromText(extractedText);

        // Store generated mind map data in sessionStorage under dedicated key
        sessionStorage.setItem(`${mindMapKeyPrefix}${pdfKey}`, JSON.stringify(mindMapData));

        toast({
          title: "Success",
          description: "Mind map generated successfully!",
        });
        // Pass pdf key to mindmap page so that it knows which PDF/mindmap to show.
        navigate("/mindmap", { state: { pdfKey } });
      } catch (error: any) {
        // API rate limit/retry logic
        if (
          error instanceof Error &&
          (error.message.includes("quota") ||
            error.message.includes("429") ||
            error.message.includes("rate limit"))
        ) {
          if (retryAttempt < maxRetries) {
            const nextRetry = retryAttempt + 1;
            setRetryAttempt(nextRetry);

            toast({
              title: `API Rate Limit Exceeded (Attempt ${nextRetry}/${maxRetries})`,
              description: `Retrying in ${retryDelay / 1000} seconds...`,
              variant: "warning",
              duration: retryDelay,
            });

            setTimeout(() => {
              processAndGenerateMindMap(selectedFile, pdfKey);
            }, retryDelay);
            return;
          } else {
            throw new Error(
              "Gemini API rate limit exceeded. Please wait a few minutes and try again. This can happen due to free tier limitations (15 requests per minute)."
            );
          }
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
      setIsProcessing(false);
    } finally {
      if (retryAttempt === 0 || retryAttempt >= maxRetries) {
        setIsProcessing(false);
      }
    }
  }

  const presetQuestions = [
    "What are the main topics covered in this paper?",
    "Can you summarize the key findings?",
    "What are the research methods used?",
    "What are the limitations of this study?",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Logo className="h-12 w-12 text-[#333]" />
            <h1 className="text-4xl font-bold text-[#333]">mapmypaper</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mb-3">
            Transform academic papers into visual knowledge maps. Read research papers faster, save time, 
            increase comprehension, and boost retention with our AI-powered visualization tools.
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Perfect for visual learners, researchers, scientists, and students who want to quickly grasp and remember complex information.
          </p>
        </div>

        <div className="w-full max-w-xl bg-white rounded-lg shadow-sm p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors mb-6 ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            } cursor-pointer flex flex-col items-center justify-center gap-4`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <p className="text-lg font-medium">Drag and drop your PDFs here</p>
              <p className="text-gray-500">or select files from your computer</p>
            </div>
          </div>

          {pdfFiles.length > 0 && (
            <Tabs
              value={activePdfKey || undefined}
              onValueChange={setActivePdfKey}
              className="mb-6"
            >
              <TabsList className="overflow-auto pb-0">
                {pdfFiles.map((file) => (
                  <TabsTrigger
                    key={getPdfKey(file)}
                    value={getPdfKey(file)}
                    className="relative"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePdf(getPdfKey(file));
                      }}
                      className="ml-2 p-0.5 rounded hover:bg-gray-200 focus:outline-none"
                      tabIndex={-1}
                      title="Remove PDF"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Content for each PDF tab */}
              {pdfFiles.map((file) => (
                <TabsContent
                  key={getPdfKey(file)}
                  value={getPdfKey(file)}
                  className="pt-4"
                >
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between mb-6">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateMindmap}
                    className="w-full bg-[#333] hover:bg-[#444] text-white"
                    disabled={isProcessing || activePdfKey !== getPdfKey(file)}
                    size="lg"
                  >
                    {isProcessing && activePdfKey === getPdfKey(file)
                      ? `Processing${retryAttempt > 0 ? ` (Retry ${retryAttempt}/${maxRetries})` : '...'}`
                      : "Generate Mind Map"}
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {extractionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{extractionError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
