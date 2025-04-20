
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import { storePdfData } from "@/utils/pdfStorage";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        toast({
          title: "PDF uploaded successfully",
          description: `File: ${file.name}`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        toast({
          title: "PDF uploaded successfully",
          description: `File: ${file.name}`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleGenerateMindmap = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractionError(null);
    
    toast({
      title: "Processing PDF",
      description: "Extracting text and generating mind map...",
    });

    try {
      // First, read the PDF as DataURL for viewing later
      const reader = new FileReader();
      
      // We'll wait for the reader to finish loading
      const pdfDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const base64data = e.target?.result as string;
            if (!base64data) {
              reject(new Error("Failed to read PDF file"));
              return;
            }
            resolve(base64data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Error reading PDF file"));
        reader.readAsDataURL(selectedFile);
      });
      
      // Get the PDF data and store it in IndexedDB
      const pdfData = await pdfDataPromise;
      await storePdfData(pdfData);
      console.log("PDF data stored to IndexedDB successfully");
      
      // Extract text from PDF
      const extractedText = await PdfToText(selectedFile);
      
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim() === '') {
        throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
      }
      
      // Process the text with Gemini to generate mind map data
      const mindMapData = await generateMindMapFromText(extractedText);
      
      // Store the generated mind map data in sessionStorage (this is much smaller than the PDF)
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      
      // Navigate to the mind map view
      toast({
        title: "Success",
        description: "Mind map generated successfully!",
      });
      navigate("/mindmap");
    } catch (error) {
      console.error("Error processing PDF:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [selectedFile, navigate, toast]);

  const presetQuestions = [
    "What are the main topics covered in this paper?",
    "Can you summarize the key findings?",
    "What are the research methods used?",
    "What are the limitations of this study?",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 mt-16">
        <div className="text-center mb-12 mt-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Brain className="h-12 w-12 text-[#333]" />
            <h1 className="text-4xl font-bold text-[#333]">mapmypaper</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl">
            Transform academic papers into visual knowledge maps. Read research papers faster, save time, 
            increase comprehension, and boost retention with our AI-powered visualization tools.
          </p>
          <p className="mt-4 text-sm text-gray-500 max-w-xl mx-auto">
            Perfect for visual learners, researchers, scientists, and students who want to quickly grasp and remember complex information.
          </p>
        </div>
        
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
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
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <p className="text-lg font-medium">Drag and drop your PDF here</p>
              <p className="text-gray-500">or select a file from your computer</p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between mb-6">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleGenerateMindmap} 
            className="w-full bg-[#333] hover:bg-[#444] text-white" 
            disabled={!selectedFile || isProcessing}
            size="lg"
          >
            {isProcessing ? "Processing..." : "Generate Mind Map"}
          </Button>
          
          {extractionError && (
            <p className="text-red-500 text-sm mt-4">{extractionError}</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PdfUpload;
