
import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, ArrowRight, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { usePdfProcessor, ExtractedImage } from "@/hooks/usePdfProcessor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("text");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processPdf, isLoading, error } = usePdfProcessor();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setExtractedText("");
      setExtractedImages([]);
      toast({
        title: "PDF Selected",
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
      });
    } else if (selectedFile) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a PDF file.",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setExtractedText("");
      setExtractedImages([]);
      toast({
        title: "PDF Uploaded",
        description: `${droppedFile.name} (${(droppedFile.size / 1024).toFixed(2)} KB)`,
      });
    } else if (droppedFile) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a PDF file.",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleProcessPdf = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No PDF selected",
        description: "Please select a PDF file first.",
      });
      return;
    }

    try {
      const content = await processPdf(file);
      setExtractedText(content.text);
      setExtractedImages(content.images);
      
      // Determine which tab to show based on the extracted content
      if (content.images.length > 0) {
        setActiveTab("images");
      } else {
        setActiveTab("text");
      }
      
      toast({
        title: "PDF Processed",
        description: `Extracted ${content.images.length} images and ${content.text.length} characters of text.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error || "Failed to process PDF.",
      });
    }
  };

  const handleContinueToMindMap = () => {
    // Store extracted content in localStorage
    if (extractedText || extractedImages.length > 0) {
      localStorage.setItem('extractedPdfText', extractedText);
      localStorage.setItem('extractedPdfImages', JSON.stringify(extractedImages));
      toast({
        title: "Content Saved",
        description: "The extracted content is ready for mind mapping.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Content Available",
        description: "Please extract content from a PDF first.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="py-2 px-8 border-b bg-[#222222]">
        <div className="max-w-5xl mx-auto flex items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-white" />
            <h1 className="text-base font-medium text-white">PaperMind</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDF Content Extraction</h1>
            <p className="mt-2 text-lg text-gray-600">Upload your research paper to extract text and images for mind mapping</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Upload PDF</CardTitle>
                <CardDescription>
                  Drag and drop your PDF file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-primary"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf"
                  />
                  <Upload className={`h-12 w-12 ${file ? "text-green-500" : "text-gray-400"}`} />
                  <p className="mt-4 text-sm text-center text-gray-500">
                    {file ? file.name : "Drop your PDF here or click to browse"}
                  </p>
                  {file && (
                    <p className="mt-2 text-xs text-center text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setExtractedText("");
                    setExtractedImages([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={!file}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleProcessPdf} 
                  disabled={!file || isLoading}
                >
                  {isLoading ? "Processing..." : "Extract Content"}
                </Button>
              </CardFooter>
            </Card>

            {/* Results Section */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Extracted Content</CardTitle>
                <CardDescription>
                  Content extracted from your PDF
                </CardDescription>
                {(extractedText || extractedImages.length > 0) && (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">
                        <FileText className="h-4 w-4 mr-2" />
                        Text
                      </TabsTrigger>
                      <TabsTrigger value="images">
                        <Image className="h-4 w-4 mr-2" />
                        Images ({extractedImages.length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <TabsContent value="text" className="mt-0">
                  <div className="bg-white border rounded-md h-[300px] overflow-auto p-4">
                    {extractedText ? (
                      <pre className="text-sm whitespace-pre-wrap font-sans">{extractedText}</pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <p>Extract content from your PDF to see text here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="images" className="mt-0">
                  <div className="bg-white border rounded-md h-[300px] overflow-auto p-4">
                    {extractedImages && extractedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {extractedImages.map((image) => (
                          <div key={image.id} className="border rounded p-2">
                            <img 
                              src={image.data} 
                              alt={`Image from page ${image.pageNumber}`} 
                              className="w-full h-auto object-contain"
                            />
                            <p className="text-xs text-center mt-1 text-muted-foreground">
                              Page {image.pageNumber}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <p>No images found in the PDF</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={!extractedText && extractedImages.length === 0}
                  onClick={handleContinueToMindMap}
                  asChild
                >
                  <Link to="/mindmap">
                    Continue to Mind Map <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 px-8 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              PaperMind — Transform research into visual knowledge
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
