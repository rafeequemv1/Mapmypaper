import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Brain, Trash } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import extractTextFromPdf from "react-pdftotext";
import { useAuth } from "@/contexts/AuthContext";

// Function to get PDF file name without extension
const getFileNameWithoutExtension = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, "");
};

// Function to format bytes to readable size
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle when file is selected
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Check if file is a PDF
    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Clear session storage from previous uploads
    sessionStorage.removeItem("pdfText");
    sessionStorage.removeItem("pdfUrl");
    
    // Store the PDF file and create object URL
    setFile(selectedFile);
    
    // Store the filename
    sessionStorage.setItem("pdfFileName", selectedFile.name);
  };

  // Handle PDF processing and navigation to mindmap
  const handleContinue = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze documents.",
        variant: "destructive",
      });
      navigate("/sign-in");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Extract text from PDF
      const startTime = Date.now();
      console.log(`Starting PDF text extraction for ${file.name} (${formatBytes(file.size)})`);

      const pdfText = await extractTextFromPdf(file);
      setUploadProgress(80);
      
      console.log(`PDF text extracted in ${(Date.now() - startTime) / 1000}s. Text length: ${pdfText.length}`);

      // Store PDF text in session storage
      sessionStorage.setItem("pdfText", pdfText);
      
      // Also store an object URL for the PDF for viewing
      const objectUrl = URL.createObjectURL(file);
      sessionStorage.setItem("pdfUrl", objectUrl);
      
      setUploadProgress(100);
      
      toast({
        title: "PDF processed successfully",
        description: "Navigating to mind map view...",
      });

      // Navigate to the mindmap page
      setTimeout(() => navigate("/mindmap"), 1000);
    } catch (error) {
      console.error("PDF processing error:", error);
      toast({
        title: "Processing failed",
        description: "Failed to extract text from the PDF. Please try another file.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file deletion
  const handleDeleteFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    sessionStorage.removeItem("pdfUrl");
    sessionStorage.removeItem("pdfText");
    sessionStorage.removeItem("pdfFileName");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm">
        <div className="flex items-center justify-center mb-8">
          <Brain className="h-8 w-8 text-black mr-2" />
          <h1 className="text-2xl font-bold">DocuMind</h1>
        </div>
        
        {!file ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              Upload your PDF document to create a mind map
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select PDF
            </Button>
          </div>
        ) : (
          <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-black mr-2" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-gray-500 text-xs">{formatBytes(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteFile}
                className="h-8 w-8 p-0"
                disabled={isUploading}
              >
                <Trash className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            
            {isUploading ? (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            ) : (
              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                onClick={handleContinue}
              >
                <Brain className="h-4 w-4 mr-2" />
                Analyze Document
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;
