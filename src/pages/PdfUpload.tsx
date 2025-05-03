
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import Logo from "@/components/Logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function getPdfKey(file: File) {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractFigures, setExtractFigures] = useState(false);
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
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const extractedText = await PdfToText(file);
      const mindMapData = await generateMindMapFromText(extractedText);
      
      sessionStorage.setItem(`mindMapData_${getPdfKey(file)}`, JSON.stringify(mindMapData));
      navigate("/mindmap", { state: { pdfKey: getPdfKey(file) } });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Logo className="h-12 w-12" />
            <h1 className="text-4xl font-bold">mapmypaper</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mb-3">
            Transform academic papers into visual knowledge maps. Read research papers 
            faster, save time, increase comprehension, and boost retention with our AI-powered 
            visualization tools.
          </p>
          <p className="text-sm text-gray-500">
            Perfect for visual learners, researchers, scientists, and students who want to quickly grasp and 
            remember complex information.
          </p>
        </div>

        <div className="w-full max-w-xl bg-white rounded-lg p-8">
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

          <div className="flex items-center space-x-2 mb-6">
            <Checkbox
              id="extractFigures"
              checked={extractFigures}
              onCheckedChange={(checked) => setExtractFigures(checked as boolean)}
            />
            <Label htmlFor="extractFigures">Extract figures from PDF</Label>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-500 hover:bg-gray-600"
            size="lg"
            disabled={isProcessing}
          >
            Generate Mind Map
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
