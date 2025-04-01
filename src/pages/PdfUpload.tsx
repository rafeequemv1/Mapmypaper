import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, Upload, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Crisp when the component mounts (main landing page)
  useEffect(() => {
    // Show Crisp chat widget on main landing page
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:show"]);
    }
    
    // Hide Crisp chat when navigating away from this page
    return () => {
      if (window.$crisp) {
        window.$crisp.push(["do", "chat:hide"]);
      }
    };
  }, []);

  // Function to open Crisp chat
  const openCrispChat = () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
      
      toast({
        title: "Chat Opened",
        description: "Our support team is ready to help you.",
      });
    } else {
      toast({
        title: "Chat Unavailable",
        description: "The chat service is currently unavailable. Please try again later.",
        variant: "destructive",
      });
    }
  };

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
      reader.onload = (e) => {
        const base64data = e.target?.result as string;
        // Store PDF data under both keys for compatibility
        sessionStorage.setItem('pdfData', base64data);
        sessionStorage.setItem('uploadedPdfData', base64data);
        console.log("PDF data stored, length:", base64data.length);
      };
      reader.readAsDataURL(selectedFile);
      
      // Extract text from PDF
      const extractedText = await PdfToText(selectedFile);
      
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim() === '') {
        throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
      }
      
      // Process the text with Gemini to generate mind map data
      const mindMapData = await generateMindMapFromText(extractedText);
      
      // Store the generated mind map data in sessionStorage
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <Brain className="h-10 w-10 text-[#333]" />
            <h1 className="text-4xl font-bold text-[#333]">MapMyPaper</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl">
            Upload your academic paper or research document to automatically generate interactive mind maps, summaries, and AI-powered insights
          </p>
        </div>
        
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          {/* Dropzone */}
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
          
          {/* Selected File Info */}
          {selectedFile && (
            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between mb-6">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          
          <div className="flex w-full gap-2">
            {/* Generate Button */}
            <Button 
              onClick={handleGenerateMindmap} 
              className="flex-1 bg-[#333] hover:bg-[#444] text-white" 
              disabled={!selectedFile || isProcessing}
              size="lg"
            >
              {isProcessing ? "Processing..." : "Generate Mind Map"}
            </Button>
            
            {/* Chat Support Button */}
            <Button onClick={openCrispChat} variant="outline" size="lg" className="px-3">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
          
          {extractionError && (
            <p className="text-red-500 text-sm mt-4">{extractionError}</p>
          )}
        </div>
      </div>
      
      <footer className="py-4 text-center text-gray-500 text-sm">
        MapMyPaper — Transform research into visual knowledge
      </footer>
    </div>
  );
};

export default PdfUpload;
