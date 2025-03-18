
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Brain, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleGenerateMindmap = useCallback(() => {
    if (selectedFile) {
      // In a real implementation, you would process the PDF here
      // For now, we'll just navigate to the mindmap page
      navigate("/mindmap");
    } else {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
    }
  }, [selectedFile, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Header - thin and black */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white">PaperMind</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Upload PDF Document</CardTitle>
            <CardDescription>
              Upload your research paper or document to generate a mind map
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Dropzone */}
            <div
              className={`border-2 border-dashed rounded-lg p-10 transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              } text-center cursor-pointer relative flex flex-col items-center justify-center gap-4`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium">
                  Drag & drop your PDF here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported format: PDF
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Select PDF
                </Button>
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="p-4 bg-secondary rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateMindmap} 
              className="w-full" 
              disabled={!selectedFile}
            >
              Generate Mindmap
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-2 px-8 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              PaperMind Mapper — Transform research into visual knowledge
            </p>
            <Separator className="md:hidden" />
            <div className="text-sm text-muted-foreground">
              © 2023 PaperMind
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
