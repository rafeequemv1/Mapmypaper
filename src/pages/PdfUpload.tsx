
import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, FileText, GraduationCap, Network, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
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
        // Store the filename in sessionStorage
        sessionStorage.setItem('pdfFileName', file.name);
        toast({
          title: "PDF uploaded successfully",
          description: `File: ${file.name}`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        // Store the filename in sessionStorage
        sessionStorage.setItem('pdfFileName', file.name);
        toast({
          title: "PDF uploaded successfully",
          description: `File: ${file.name}`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleGenerateMindmap = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    setExtractionError(null);
    toast({
      title: "Processing PDF",
      description: "Extracting text and generating mind map..."
    });
    try {
      // First, read the PDF as DataURL for viewing later
      const reader = new FileReader();
      reader.onload = e => {
        const base64data = e.target?.result as string;
        // Store PDF data under both keys for compatibility
        sessionStorage.setItem('pdfData', base64data);
        sessionStorage.setItem('uploadedPdfData', base64data);
        console.log("PDF data stored, length:", base64data.length);
      };
      reader.readAsDataURL(selectedFile);

      // Extract text from PDF
      const extractedText = await PdfToText(selectedFile);
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim() === '') {
        throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
      }

      // Process the text with Gemini to generate mind map data
      const mindMapData = await generateMindMapFromText(extractedText);

      // Store the generated mind map data in sessionStorage
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));

      // Navigate to the mind map view
      toast({
        title: "Success",
        description: "Mind map generated successfully!"
      });
      navigate("/mindmap");
    } catch (error) {
      console.error("Error processing PDF:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  }, [selectedFile, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9f9] dark:bg-[#111]">
      {/* Header */}
      <header className="py-4 px-8 border-b bg-[#000000] text-white dark:bg-[#000] dark:border-[#222]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-white" />
            <h1 className="text-xl font-medium text-white">MapMyPaper</h1>
          </div>
          <nav className="flex items-center">
            <ul className="hidden md:flex gap-8 text-white/80 mr-6">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#get-started" className="hover:text-white transition-colors">Get Started</a></li>
            </ul>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-[#000000]" 
              onClick={() => navigate("/mindmap")}
            >
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Dropzone */}
      <section className="py-20 px-4 bg-white dark:bg-[#111]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-[#000000] dark:text-white leading-tight">
              Transform Research Papers into Visual Knowledge
            </h1>
            <p className="text-lg text-[#333] dark:text-gray-300 max-w-lg">
              Turn complex research papers into clear, interactive mindmaps with our AI-powered tool.
            </p>
            <a href="#get-started" className="inline-block">
              <Button className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90">
                Get Started
              </Button>
            </a>
          </div>
          
          {/* Dropzone */}
          <div id="get-started" className="bg-white border border-[#eaeaea] p-8 rounded-lg shadow-sm dark:bg-[#191919] dark:border-[#333]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#000000] dark:text-white">Upload Your Paper</h2>
              <p className="text-[#555] dark:text-gray-400">
                Upload a research paper or academic PDF to generate an interactive mind map.
              </p>
              
              {/* Simple Dropzone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive ? "border-black bg-gray-50 dark:border-white dark:bg-[#222]" : "border-gray-300 dark:border-gray-700"
                } cursor-pointer flex flex-col items-center justify-center gap-4`} 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop} 
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                <FileText className="h-12 w-12 text-black dark:text-white" />
                <p className="text-center text-[#333] dark:text-gray-300">
                  Drag & drop your PDF here<br />or click to browse
                </p>
              </div>
              
              {/* Selected File Info */}
              {selectedFile && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between dark:bg-[#222]">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-black dark:text-white" />
                    <div>
                      <p className="font-medium text-[#000000] dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-[#555] dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generate Button */}
              <Button 
                onClick={handleGenerateMindmap} 
                className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 mt-4" 
                disabled={!selectedFile || isProcessing} 
                size="lg"
              >
                {isProcessing ? "Processing..." : "Generate Mindmap with AI"}
                <Brain className="ml-2 h-5 w-5" />
              </Button>
              
              {extractionError && <p className="text-red-500 text-sm mt-2">{extractionError}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#f7f7f7] dark:bg-[#161616]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#000000] dark:text-white">Key Features</h2>
            <p className="mt-4 text-lg text-[#555] dark:text-gray-400 max-w-2xl mx-auto">
              Discover how MapMyPaper transforms the way you interact with academic research.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg border border-[#eaeaea] transition-shadow hover:shadow-md dark:bg-[#191919] dark:border-[#333]">
              <div className="p-3 bg-[#f2f2f2] w-fit rounded-full mb-4 dark:bg-[#222]">
                <Brain className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-[#555] dark:text-gray-400">
                Google Gemini AI extracts key concepts and relationships from your papers to create meaningful mind maps.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg border border-[#eaeaea] transition-shadow hover:shadow-md dark:bg-[#191919] dark:border-[#333]">
              <div className="p-3 bg-[#f2f2f2] w-fit rounded-full mb-4 dark:bg-[#222]">
                <Network className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-2">Interactive Visualizations</h3>
              <p className="text-[#555] dark:text-gray-400">
                Explore and edit your mind maps dynamically with an intuitive interface for better comprehension.
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg border border-[#eaeaea] transition-shadow hover:shadow-md dark:bg-[#191919] dark:border-[#333]">
              <div className="p-3 bg-[#f2f2f2] w-fit rounded-full mb-4 dark:bg-[#222]">
                <BookOpen className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-2">PDF Integration</h3>
              <p className="text-[#555] dark:text-gray-400">
                View your original PDF alongside the mind map for easy reference and context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#000000] dark:text-white">How It Works</h2>
            <p className="mt-4 text-lg text-[#555] dark:text-gray-400 max-w-2xl mx-auto">
              Transform your research papers into visual knowledge in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold dark:bg-white dark:text-black">1</div>
              <div className="bg-white p-6 rounded-lg border border-[#eaeaea] h-full dark:bg-[#191919] dark:border-[#333]">
                <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-3">Upload Your PDF</h3>
                <p className="text-[#555] dark:text-gray-400">
                  Drag and drop your research paper or academic PDF to start the process.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold dark:bg-white dark:text-black">2</div>
              <div className="bg-white p-6 rounded-lg border border-[#eaeaea] h-full dark:bg-[#191919] dark:border-[#333]">
                <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-3">AI Processing</h3>
                <p className="text-[#555] dark:text-gray-400">
                  Our AI analyzes the content, extracts key concepts, and structures the information.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold dark:bg-white dark:text-black">3</div>
              <div className="bg-white p-6 rounded-lg border border-[#eaeaea] h-full dark:bg-[#191919] dark:border-[#333]">
                <h3 className="text-xl font-semibold text-[#000000] dark:text-white mb-3">Explore Your Mind Map</h3>
                <p className="text-[#555] dark:text-gray-400">
                  Interact with your visual knowledge map, edit nodes, and export for your research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-black text-white dark:bg-white dark:text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-700">
            Upload your academic paper now and experience the power of visual knowledge mapping.
          </p>
          <a href="#get-started">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white hover:bg-white hover:text-black dark:border-black dark:text-black dark:hover:bg-black dark:hover:text-white"
            >
              Get Started Now
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 bg-[#111] text-white dark:bg-[#000]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-white" />
              <span className="text-xl font-medium">MapMyPaper</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} MapMyPaper — Transform research into visual knowledge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
