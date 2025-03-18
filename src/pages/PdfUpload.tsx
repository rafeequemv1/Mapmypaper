import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, FileText, Upload, FileSymlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateMindMapFromText } from "@/services/geminiService";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
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

  const extractTextFromPdf = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log("Starting PDF extraction with file:", file.name, file.type, file.size);
      
      // Direct approach using the library with the file
      const extractionPromise = PdfToText(file).then((text: string) => {
        console.log("Raw extraction result:", text);
        if (!text || typeof text !== 'string' || text.trim() === '') {
          throw new Error("No text could be extracted from the PDF");
        }
        return text;
      });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<string>((_, timeoutReject) => {
        setTimeout(() => timeoutReject(new Error("PDF extraction timed out")), 30000);
      });
      
      // Race between the PDF extraction and the timeout
      Promise.race([extractionPromise, timeoutPromise])
        .then((text) => {
          console.log("Text extracted successfully, length:", text.length);
          setExtractedText(text);
          resolve(text);
        })
        .catch((error) => {
          console.error("PDF extraction error:", error);
          reject(error instanceof Error ? error : new Error("Failed to extract text from PDF"));
        });
    });
  };

  const handleExtractText = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    toast({
      title: "Processing PDF",
      description: "Extracting text from PDF...",
    });

    try {
      await extractTextFromPdf(selectedFile);
      toast({
        title: "Success",
        description: "Text extracted successfully!",
      });
    } catch (error) {
      console.error("Error extracting text:", error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract text from PDF",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }, [selectedFile, toast]);

  const handleGenerateMindmap = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    if (!extractedText) {
      toast({
        title: "Extract text first",
        description: "Please extract text from the PDF before generating a mind map",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing",
      description: "Generating mind map with Gemini AI...",
    });

    try {
      // Process the text with Gemini to generate mind map data
      const mindMapData = await generateMindMapFromText(extractedText);
      
      // Store the generated mind map data in sessionStorage
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      
      // Navigate to the mind map view
      navigate("/mindmap");
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate mind map",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [selectedFile, navigate, toast, extractedText]);

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
              Upload your research paper or document to generate a mind map with Google Gemini AI
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
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                id="file-upload"
                ref={fileInputRef}
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
                <Button 
                  onClick={handleExtractText} 
                  variant="outline"
                  disabled={isExtracting || !selectedFile}
                  className="gap-2"
                >
                  {isExtracting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Extracting...
                    </>
                  ) : (
                    <>
                      Extract Text
                      <FileSymlink className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Extraction Status */}
            {extractedText && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <FileText className="h-5 w-5" />
                  <p className="font-medium">Text extracted successfully!</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Extracted {extractedText.length.toLocaleString()} characters
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateMindmap} 
              className="w-full" 
              disabled={!selectedFile || isProcessing || !extractedText}
            >
              {isProcessing ? "Processing..." : "Generate Mindmap with Gemini AI"}
              <Brain className="ml-2 h-4 w-4" />
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
