
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { storePDFInStorage } from "@/utils/pdfStorage";
import { Button } from "@/components/ui/button";
import { Upload, FileText, GitBranch, Map } from "lucide-react";
import PaperLogo from "@/components/PaperLogo";
import { useVisualizationContext } from "@/contexts/VisualizationContext";

const PdfUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openVisualization } = useVisualizationContext();

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await storePDFInStorage(selectedFile);
      
      toast({
        title: "Upload successful",
        description: "PDF uploaded successfully",
      });
      
      // Navigate to the mind map page
      navigate('/mindmap');
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <PaperLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-purple-900">MapMyPaper</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Visualize Your Research Papers</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a PDF to create interactive mind maps and visualizations that help you understand and organize research content
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <div className="bg-purple-100 text-purple-800 rounded-full px-4 py-1 text-sm font-medium flex items-center">
            <Map className="w-4 h-4 mr-1" />
            Interactive Mind Maps
          </div>
          <div className="bg-blue-100 text-blue-800 rounded-full px-4 py-1 text-sm font-medium flex items-center">
            <GitBranch className="w-4 h-4 mr-1" />
            Process Flowcharts
          </div>
          <div className="bg-green-100 text-green-800 rounded-full px-4 py-1 text-sm font-medium flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Smart Extraction
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className={`w-full max-w-xl p-8 mb-10 rounded-lg border-2 border-dashed transition-colors duration-200 text-center
            ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'}
            ${selectedFile ? 'border-green-500 bg-green-50' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`} />
          
          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">Selected file:</p>
              <p className="text-gray-600 mb-4 break-all">{selectedFile.name}</p>
              <Button 
                onClick={handleUpload} 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Processing...' : 'Analyze PDF'}
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop your PDF file here</p>
              <p className="text-gray-500 mb-4">or</p>
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-input')?.click()}
                className="border-purple-600 text-purple-600"
              >
                Select PDF File
              </Button>
              <input 
                id="file-input" 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileInput} 
                className="hidden" 
              />
            </div>
          )}
        </div>

        {/* Visualization buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button 
            variant="outline"
            onClick={() => openVisualization("mindmap")}
            className="border-purple-600 text-purple-600"
          >
            <Map className="w-4 h-4 mr-2" />
            Create Mind Map
          </Button>
          <Button 
            variant="outline"
            onClick={() => openVisualization("flowchart")}
            className="border-blue-600 text-blue-600"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Create Flowchart
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto py-6 px-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} MapMyPaper. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PdfUpload;
