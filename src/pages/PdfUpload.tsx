
import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, FileText, GraduationCap, Network, LogIn, UserPlus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import { useAuth } from "@/contexts/AuthContext";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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

  const handleGenerateMindmap = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a mind map",
        variant: "destructive",
      });
      navigate("/sign-in");
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractionError(null);
    
    toast({
      title: "Processing PDF",
      description: "Extracting text and generating mind map...",
    });

    try {
      // First, read the PDF as DataURL for viewing later
      const reader = new FileReader();
      reader.onload = (e) => {
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
        description: "Mind map generated successfully!",
      });
      navigate("/mindmap");
    } catch (error) {
      console.error("Error processing PDF:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [selectedFile, navigate, toast, user]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-8 border-b bg-[#222222]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-white" />
            <h1 className="text-xl font-medium text-white">PaperMind</h1>
          </div>
          <nav className="flex items-center">
            <ul className="flex gap-8 text-white/80 mr-6">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#get-started" className="hover:text-white transition-colors">Get Started</a></li>
            </ul>
            {user ? (
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-[#222222]"
                onClick={() => navigate("/mindmap")}
              >
                Dashboard
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10"
                  asChild
                >
                  <Link to="/sign-in">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-[#222222]"
                  asChild
                >
                  <Link to="/sign-up">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section with Dropzone */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Transform Research Papers into Visual Knowledge
            </h1>
            <p className="text-lg text-slate-700 max-w-lg">
              Upload your academic papers and transform them into interactive mind maps using AI. Visualize complex concepts, enhance comprehension, and accelerate your research.
            </p>
            <a href="#get-started" className="inline-block">
              <Button size="lg" className="mt-2 bg-indigo-600 hover:bg-indigo-700">
                Get Started Now
                <GraduationCap className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
          
          {/* Dropzone */}
          <div id="get-started" className="bg-white p-8 rounded-xl shadow-lg">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">Upload Your Paper</h2>
              <p className="text-slate-600">
                Upload a research paper or academic PDF to generate an interactive mind map.
              </p>
              
              {/* Simple Dropzone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300"
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
                <FileText className="h-12 w-12 text-indigo-500" />
                <p className="text-center text-slate-700">
                  Drag & drop your PDF here<br />or click to browse
                </p>
              </div>
              
              {/* Selected File Info */}
              {selectedFile && (
                <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generate Button */}
              <Button 
                onClick={handleGenerateMindmap} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4" 
                disabled={!selectedFile || isProcessing}
                size="lg"
              >
                {isProcessing ? "Processing..." : "Generate Mindmap with AI"}
                <Brain className="ml-2 h-5 w-5" />
              </Button>
              
              {extractionError && (
                <p className="text-red-500 text-sm mt-2">{extractionError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Key Features</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Discover how PaperMind transforms the way you interact with academic research.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="p-3 bg-indigo-100 w-fit rounded-full mb-4">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-600">
                Google Gemini AI extracts key concepts and relationships from your papers to create meaningful mind maps.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="p-3 bg-indigo-100 w-fit rounded-full mb-4">
                <Network className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Interactive Visualizations</h3>
              <p className="text-slate-600">
                Explore and edit your mind maps dynamically with an intuitive interface for better comprehension.
              </p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="p-3 bg-indigo-100 w-fit rounded-full mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">PDF Integration</h3>
              <p className="text-slate-600">
                View your original PDF alongside the mind map for easy reference and context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Transform your research papers into visual knowledge in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">1</div>
              <div className="bg-white p-6 rounded-xl shadow-md h-full">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload Your PDF</h3>
                <p className="text-slate-600">
                  Drag and drop your research paper or academic PDF to start the process.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">2</div>
              <div className="bg-white p-6 rounded-xl shadow-md h-full">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Processing</h3>
                <p className="text-slate-600">
                  Our AI analyzes the content, extracts key concepts, and structures the information.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">3</div>
              <div className="bg-white p-6 rounded-xl shadow-md h-full">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Explore Your Mind Map</h3>
                <p className="text-slate-600">
                  Interact with your visual knowledge map, edit nodes, and export for your research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Upload your academic paper now and experience the power of visual knowledge mapping.
          </p>
          <a href="#get-started">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
              Get Started Now
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-400" />
              <span className="text-xl font-medium">PaperMind</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2023 PaperMind — Transform research into visual knowledge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
