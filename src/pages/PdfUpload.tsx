import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, FileText, Upload, KeyRound, FileSymlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGeminiApiKey, generateMindMapFromText } from "@/services/geminiService";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
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

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      const success = setGeminiApiKey(apiKey.trim());
      if (success) {
        setShowApiKeyInput(false);
        toast({
          title: "API Key saved",
          description: "Your Gemini API key has been saved for this session.",
        });
      }
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please provide a valid Gemini API key",
        variant: "destructive",
      });
    }
  };
  
  const extractTextFromPdf = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          if (!arrayBuffer) {
            throw new Error("Failed to read file");
          }
          
          // Create a Blob from the Uint8Array
          const blob = new Blob([new Uint8Array(arrayBuffer)], { type: 'application/pdf' });
          
          console.log("Converting PDF to text...");
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<string>((_, timeoutReject) => {
            setTimeout(() => timeoutReject(new Error("PDF extraction timed out")), 30000);
          });
          
          // Race between the PDF extraction and the timeout
          const text = await Promise.race([
            PdfToText(blob),
            timeoutPromise
          ]);
          
          if (!text || typeof text !== 'string' || text.trim() === '') {
            throw new Error("No text could be extracted from the PDF");
          }
          
          console.log("Text extracted successfully, length:", text.length);
          setExtractedText(text);
          resolve(text);
        } catch (error) {
          console.error("PDF extraction error:", error);
          reject(error instanceof Error ? error : new Error("Failed to extract text from PDF"));
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Error reading the file"));
      };
      
      reader.readAsArrayBuffer(file);
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

    if (showApiKeyInput) {
      toast({
        title: "API Key required",
        description: "Please provide your Gemini API key first",
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
  }, [selectedFile, navigate, toast, showApiKeyInput, extractedText]);

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
            {/* API Key Input */}
            {showApiKeyInput && (
              <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Google Gemini API Key</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Enter your Gemini API key to process PDF content</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="api-key" 
                      type="password" 
                      placeholder="Gemini API Key" 
                      value={apiKey}
                      onChange={handleApiKeyChange}
                    />
                    <Button onClick={handleApiKeySubmit}>Save Key</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally in this browser session only and is not saved to any database.
                  </p>
                </div>
              </div>
            )}

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
              disabled={!selectedFile || isProcessing || showApiKeyInput || !extractedText}
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
