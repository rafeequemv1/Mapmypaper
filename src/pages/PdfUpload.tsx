
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Linkedin, Twitter } from "lucide-react";
import { User } from "@supabase/supabase-js";
import AuthButton from "@/components/auth/AuthButton";

interface PdfUploadProps {
  user: User | null;
  onAuthChange: () => void;
}

const PdfUpload = ({ user, onAuthChange }: PdfUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Store PDF as base64 string
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        const pdfData = reader.result as string;
        sessionStorage.setItem("uploadedPdfData", pdfData);
        sessionStorage.setItem("uploadedPdfName", file.name);
        
        // Navigate to mind map page
        toast({
          title: "PDF uploaded successfully",
          description: "Redirecting to mind map viewer..."
        });
        
        setTimeout(() => {
          navigate("/mindmap");
        }, 1500);
      };
      
    } catch (error) {
      console.error("PDF upload error:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-md">
            <Upload className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold">mapmypaper</h1>
          <div className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
            BETA
          </div>
        </div>
        
        <AuthButton user={user} onAuthChange={onAuthChange} />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            Transform Research Papers into Interactive Mind Maps
          </h1>
          
          <p className="text-gray-600 max-w-lg mx-auto">
            Upload your PDF and our AI will create a visual, navigable mind map of key concepts,
            making complex research papers easier to understand.
          </p>
          
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-10 transition-all ${
              dragActive ? "border-black bg-gray-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center gap-4 cursor-pointer"
            >
              <div className="bg-gray-100 rounded-full p-3">
                <FileText className="h-8 w-8 text-gray-700" />
              </div>
              
              <div className="space-y-1 text-center">
                <p className="text-gray-700 font-medium">
                  {isUploading ? "Uploading..." : "Drop your PDF here or click to browse"}
                </p>
                <p className="text-sm text-gray-500">
                  Accepts PDF documents (max 30MB)
                </p>
              </div>
              
              <Button
                disabled={isUploading}
                variant="default"
                className="mt-2"
              >
                {isUploading ? "Uploading..." : "Upload PDF"}
              </Button>
            </label>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} MapMyPaper. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
