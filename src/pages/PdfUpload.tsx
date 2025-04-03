
import { useState } from "react";
import { Upload, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function PdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === "application/pdf") {
        setFile(e.target.files[0]);
      } else {
        toast({
          title: "Invalid file format",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          const arrayBuffer = e.target.result;
          
          // Store in session storage
          sessionStorage.setItem("pdfData", URL.createObjectURL(
            new Blob([arrayBuffer], { type: "application/pdf" })
          ));
          
          // Save file name
          sessionStorage.setItem("pdfFileName", file.name);

          // Also store the raw buffer for text extraction 
          sessionStorage.setItem("uploadedPdfData", URL.createObjectURL(
            new Blob([arrayBuffer], { type: "application/pdf" })
          ));
          
          toast({
            title: "Upload successful",
            description: "Redirecting to Mind Map view...",
          });
          
          // Small delay to show the toast
          setTimeout(() => navigate("/mindmap"), 1000);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred during upload",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with auth buttons */}
      <header className="w-full py-4 px-6 flex justify-between items-center bg-white border-b">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-md">
            <Upload className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold">mapmypaper</h1>
          <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">BETA</div>
        </div>
        
        <div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate("/mindmap")}>
                My Mindmaps
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Transform PDFs into Interactive Mind Maps
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload a research paper or document and create visual mind maps to better understand and navigate content.
          </p>
        </div>
        
        <div className="w-full max-w-xl">
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            } ${file ? "bg-blue-50" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              {file ? (
                <>
                  <FileType className="h-12 w-12 text-blue-500 mb-4" />
                  <p className="mb-2 text-sm text-gray-600">Selected file:</p>
                  <p className="mb-4 font-semibold">{file.name}</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-600">
                    Drag and drop your PDF file here, or
                  </p>
                </>
              )}
              
              <div className="mt-2">
                {!file ? (
                  <label className="cursor-pointer">
                    <span className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md py-2 px-4 transition-colors">
                      Browse PDF Files
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? "Processing..." : "Create Mind Map"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setFile(null)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Max file size: 10MB | Supported format: PDF
          </p>
        </div>
      </main>
      
      <footer className="py-6 px-4 text-center text-gray-600 text-xs">
        <p>© {new Date().getFullYear()} MapMyPaper. All rights reserved.</p>
      </footer>
    </div>
  );
}
