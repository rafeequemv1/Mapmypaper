import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, BookText } from "lucide-react";
import { User } from "@supabase/supabase-js";
import AuthButton from "@/components/auth/AuthButton";
import { extractAndStorePdfText } from "@/services/geminiService";

interface PdfUploadProps {
  user: User | null;
  onAuthChange: () => void;
}

const PdfUpload = ({ user, onAuthChange }: PdfUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file");
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid PDF file");
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      toast({
        title: "No file selected",
        description: "Please select a PDF file first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prevProgress + 10;
      });
    }, 300);

    try {
      // Read the file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Save in session storage
        sessionStorage.setItem("pdfData", base64String);
        sessionStorage.setItem("pdfName", file.name);
        
        // Extract and save PDF text
        try {
          await extractAndStorePdfText(base64String);
          toast({
            title: "PDF Text Extracted",
            description: "Successfully extracted text from the PDF",
          });
        } catch (error) {
          console.error("Error extracting PDF text:", error);
          toast({
            title: "Warning",
            description: "PDF uploaded but text extraction may be incomplete",
            variant: "destructive",
          });
        }
        
        // Complete the progress
        clearInterval(interval);
        setProgress(100);
        
        setTimeout(() => {
          toast({
            title: "Upload Successful",
            description: "Your PDF has been uploaded successfully.",
          });
          // Navigate to the mindmap page
          navigate("/mindmap");
        }, 400);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      clearInterval(interval);
      setIsLoading(false);
      setError("Error uploading file. Please try again.");
      toast({
        title: "Upload Failed",
        description: "Error uploading file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isButton = !isDragActive && !file;
  const isDragActiveClass = isDragActive ? "bg-blue-50 border-blue-300" : "border-gray-300";
  const hasFileClass = file ? "bg-green-50 border-green-300" : "";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-md">
              <Upload className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-medium">mapmypaper</h1>
            <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">BETA</div>
          </div>

          <AuthButton
            user={user}
            onAuthChange={onAuthChange}
            variant="outline"
            size="sm"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-10 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Generate interactive mindmaps from PDFs</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Upload your research paper or document to instantly create an interactive mindmap. 
            Explore concepts, follow connections, and gain deeper insights.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActiveClass} ${hasFileClass}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="py-6">
                <FileText className="mx-auto h-12 w-12 text-blue-500 mb-3" />
                <p className="text-lg font-medium">Drop your PDF here</p>
              </div>
            ) : file ? (
              <div className="py-6">
                <FileText className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <p className="text-lg font-medium mb-1">{file.name}</p>
                <p className="text-sm text-gray-500 mb-3">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button variant="outline" onClick={() => setFile(null)}>
                  Choose a different file
                </Button>
              </div>
            ) : (
              <div className="py-10">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg mb-2">
                  Drag & drop your PDF here, or <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="text-sm text-gray-500">Supported format: PDF (max 20MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 text-red-500 text-sm">{error}</div>
          )}

          {isLoading ? (
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || isLoading} 
                className="px-8 py-6 text-lg"
              >
                <BookText className="mr-2 h-5 w-5" />
                Generate Mindmap
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PdfUpload;
