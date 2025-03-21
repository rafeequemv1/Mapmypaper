
import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Brain, FileText, Upload, Sparkles, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-indigo-50">
      {/* Header */}
      <header className="py-4 px-8 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">MapMyPaper</h1>
          </div>
          <nav className="flex items-center">
            <ul className="hidden md:flex gap-8 text-slate-600 mr-6">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a></li>
              <li><a href="#get-started" className="hover:text-indigo-600 transition-colors">Get Started</a></li>
            </ul>
            <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => navigate("/mindmap")}>
              Dashboard
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Centered Dropzone */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-6 leading-tight">
            Transform Your Research Papers Into Visual Knowledge
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Upload your academic papers and instantly generate interactive mind maps powered by AI. Visualize complex concepts and accelerate your research.
          </p>
        </div>
        
        {/* Centered Dropzone */}
        <div id="get-started" className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all">
            <div className="p-8">
              {/* Simple Dropzone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"}`} 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop} 
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <Upload className="h-7 w-7 text-indigo-600" />
                </div>
                <p className="text-center text-slate-700 font-medium">
                  Drag & drop your PDF here
                </p>
                <p className="text-center text-slate-500 text-sm">
                  or click to browse files
                </p>
              </div>
              
              {/* Selected File Info */}
              {selectedFile && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700" onClick={() => setSelectedFile(null)}>
                    Remove
                  </Button>
                </div>
              )}
              
              {/* Generate Button */}
              <Button 
                onClick={handleGenerateMindmap} 
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md" 
                disabled={!selectedFile || isProcessing} 
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <span className="mr-2">Processing...</span>
                    <span className="animate-spin">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    Generate Mindmap
                    <Sparkles className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>
              
              {extractionError && <p className="text-red-500 text-sm mt-4">{extractionError}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Key Features</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Discover how MapMyPaper transforms the way you interact with academic research.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-indigo-100 w-fit rounded-full mb-4">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-600">
                Google Gemini AI extracts key concepts and relationships from your papers to create meaningful mind maps.
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-purple-100 w-fit rounded-full mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Interactive Visualizations</h3>
              <p className="text-slate-600">
                Explore and edit your mind maps dynamically with an intuitive interface for better comprehension.
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-pink-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-pink-100 w-fit rounded-full mb-4">
                <FileText className="h-6 w-6 text-pink-600" />
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
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Transform your research papers into visual knowledge in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">1</div>
              <div className="bg-white p-6 rounded-xl shadow-sm h-full border border-indigo-100 hover:shadow-md transition-all">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload Your PDF</h3>
                <p className="text-slate-600">
                  Drag and drop your research paper or academic PDF to start the process.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md">2</div>
              <div className="bg-white p-6 rounded-xl shadow-sm h-full border border-purple-100 hover:shadow-md transition-all">
                <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Processing</h3>
                <p className="text-slate-600">
                  Our AI analyzes the content, extracts key concepts, and structures the information.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-white flex items-center justify-center text-xl font-bold shadow-md">3</div>
              <div className="bg-white p-6 rounded-xl shadow-sm h-full border border-pink-100 hover:shadow-md transition-all">
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
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Upload your academic paper now and experience the power of visual knowledge mapping.
          </p>
          <a href="#get-started">
            <Button size="lg" variant="outline" className="bg-white border-white hover:bg-white/90 text-indigo-700 hover:text-indigo-800 font-medium">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
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
              <span className="text-xl font-medium">MapMyPaper</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2023 MapMyPaper — Transform research into visual knowledge
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
