import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Upload, ExternalLink, Braces, GitBranch, BrainCircuit, MessageSquare, FileDown, Clock, BarChart2, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import PaperLogo from "@/components/PaperLogo";
import { Separator } from "@/components/ui/separator";
import { storePDF } from "@/utils/pdfStorage";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";
import { trackPdfUpload, trackFeatureUsage, trackMindMapGeneration, trackEvent } from "@/utils/analytics";
import { useVisualizationContext } from "@/contexts/VisualizationContext";
import Footer from "@/components/Footer";

const PdfUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfSize, setPdfSize] = useState<number>(0);
  const { openVisualization } = useVisualizationContext();

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
        handleFileSelection(file);
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
        handleFileSelection(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  }, [toast]);
  
  const handleFileSelection = useCallback((file: File) => {
    setSelectedFile(file);
    setPdfSize(file.size);
    
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const sizeWarning = parseFloat(sizeMB) > 15;
    
    // Track the PDF upload event with more details
    trackPdfUpload(file.name, file.size);
    
    toast({
      title: "PDF uploaded successfully",
      description: `File: ${file.name}${sizeWarning ? " (Large file, processing may take longer)" : ""}`,
      variant: sizeWarning ? "warning" : "default",
    });
  }, [toast]);
  
  const handleGenerateMindmap = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a mind map",
      });
      // Store a flag in sessionStorage to indicate we should return to mindmap generation
      sessionStorage.setItem('pendingPdfProcessing', 'true');
      // Save the selected file name to session storage for better UX
      sessionStorage.setItem('pendingPdfName', selectedFile.name);
      // Track this event
      trackFeatureUsage('mindmap_generation_login_redirect');
      // Redirect to login page
      navigate("/auth");
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
      
      // Set up a promise for the file reading
      const readerPromise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const base64data = e.target?.result as string;
            if (!base64data) {
              reject(new Error("Failed to read PDF file"));
              return;
            }
            resolve(base64data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Error reading file"));
      });
      
      // Start reading the file
      reader.readAsDataURL(selectedFile);
      
      // Wait for the file to be read and store it
      const base64data = await readerPromise;
      console.log("PDF loaded, storing data...");
      
      // Store in both IndexedDB and SessionStorage (for backwards compatibility)
      await storePDF(base64data);
      
      // Also set a marker in SessionStorage that will be used for quick availability checks
      try {
        sessionStorage.setItem('pdfAvailable', 'true');
      } catch (e) {
        console.warn('Could not set pdfAvailable marker in sessionStorage, but IndexedDB storage succeeded');
      }
      
      console.log("PDF data stored successfully");
      
      // Extract text from PDF
      console.log("Extracting text from PDF...");
      const extractedText = await PdfToText(selectedFile);
      
      if (!extractedText || typeof extractedText !== 'string' || extractedText.trim() === '') {
        throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
      }
      
      // Process the text with Gemini to generate mind map data
      console.log("Generating mind map...");
      const mindMapData = await generateMindMapFromText(extractedText);
      
      // Store the generated mind map data in sessionStorage
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      
      // Track successful mind map generation
      trackMindMapGeneration(selectedFile.name);
      
      // Navigate to the mind map view
      toast({
        title: "Success",
        description: "Mind map generated successfully!",
      });
      navigate("/mindmap");
    } catch (error) {
      console.error("Error processing PDF:", error);
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF");
      
      // Track error event
      trackEvent('mindmap_generation_error', {
        error_message: error instanceof Error ? error.message : "Unknown error",
        pdf_name: selectedFile.name,
        pdf_size: selectedFile.size
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [selectedFile, navigate, toast, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-card shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <PaperLogo size="md" />
              <h1 className="text-xl font-medium text-foreground">mapmypaper</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-sm text-foreground/80 hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Contact</Link>
            
            {selectedFile && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openVisualization("mindmap")}
                  className="flex items-center gap-1"
                >
                  <Braces className="h-4 w-4" />
                  <span className="text-sm">Mind Map</span>
                </Button>
                {/* Fix: Change "flowchart" to "mindmap" since that's the only acceptable value */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openVisualization("mindmap")}
                  className="flex items-center gap-1"
                >
                  <GitBranch className="h-4 w-4" />
                  <span className="text-sm">Flowchart</span>
                </Button>
              </>
            )}
            
            <UserMenu />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 mt-6">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <span className="beta-tag mb-2">BETA</span>
            <div className="flex items-center gap-4">
              <PaperLogo size="lg" />
              <h1 className="text-4xl font-bold text-foreground">mapmypaper</h1>
            </div>
          </div>
          <p className="text-lg text-foreground/90 max-w-2xl mx-auto">
            Transform academic papers into visual knowledge maps. Read research papers faster, 
            increase comprehension, and boost retention with our AI-powered visualization tools.
          </p>
          <p className="mt-2 text-sm text-foreground/70 max-w-xl mx-auto">
            Perfect for researchers, scientists and students who want to accelerate their research process and 
            quickly grasp complex information through visual learning.
          </p>
        </div>
        
        {/* PDF Upload Box */}
        <div className="w-full max-w-md bg-card rounded-lg shadow-sm p-8">
          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors mb-6 ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
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
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">Drag and drop your PDF here</p>
              <p className="text-muted-foreground">or select a file from your computer</p>
            </div>
          </div>
          
          {/* Security message */}
          <div className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-md mb-6 text-xs text-blue-800">
            <Lock className="h-4 w-4" />
            <p>Your documents are secure and never shared with third parties</p>
          </div>
          
          {/* Selected File Info with size warning if needed */}
          {selectedFile && (
            <div className={`p-4 ${pdfSize > 15 * 1024 * 1024 ? 'bg-amber-50/50' : 'bg-secondary/50'} rounded-lg flex items-center justify-between mb-6`}>
              <p className="font-medium truncate">{selectedFile.name}</p>
              <div className="flex flex-col items-end">
                <p className="text-sm text-muted-foreground">
                  {(pdfSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {pdfSize > 15 * 1024 * 1024 && (
                  <p className="text-xs text-amber-600 mt-1">Large file - processing may take longer</p>
                )}
              </div>
            </div>
          )}
          
          {/* Generate Button */}
          <Button 
            onClick={handleGenerateMindmap} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={!selectedFile || isProcessing}
            size="lg"
          >
            {isProcessing ? "Processing..." : "Generate Mind Map"}
          </Button>
          
          {extractionError && (
            <p className="text-destructive text-sm mt-4">{extractionError}</p>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Transform How You Process Academic Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-bg-1 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <BrainCircuit className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Mind Maps</h3>
              <p className="text-foreground/80">
                Visualize complex papers as intuitive mind maps. Explore relationships between concepts and navigate through ideas effortlessly.
              </p>
            </div>
            
            <div className="feature-bg-2 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Research Assistant</h3>
              <p className="text-foreground/80">
                Chat with your papers. Ask questions, request explanations, and dive deeper into specific sections with our AI-powered assistant.
              </p>
            </div>
            
            <div className="feature-bg-3 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <GitBranch className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flowcharts & Diagrams</h3>
              <p className="text-foreground/80">
                See methodologies and processes as visual flowcharts. Understand complex procedures and technical sequences at a glance.
              </p>
            </div>
            
            <div className="feature-bg-4 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <FileDown className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Export & Share</h3>
              <p className="text-foreground/80">
                Download visualizations in multiple formats. Share with colleagues, include in presentations, or reference in your own work.
              </p>
            </div>
            
            <div className="feature-bg-5 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <Clock className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Auto-Summaries</h3>
              <p className="text-foreground/80">
                Get instant AI-generated summaries of key paper sections. Quickly understand the core findings and methodology without reading the entire paper.
              </p>
            </div>
            
            <div className="feature-bg-6 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <BarChart2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Visual Learning</h3>
              <p className="text-foreground/80">
                Optimize for visual learners. Increase retention and understanding through multimodal representations of complex academic content.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-foreground/80 max-w-2xl mx-auto mb-6">
              MapMyPaper is designed for researchers, students, and academics who need to process large volumes of complex information efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                Try It Now
              </Button>
              <Link to="/pricing">
                <Button 
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  View Pricing <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <div id="about" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Why MapMyPaper?</h2>
          
          <div className="bg-card rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Accelerate Your Research Process</h3>
            <p className="text-foreground/80 mb-4">
              MapMyPaper was developed by Scidart Academy to transform how researchers interact with academic papers. 
              Our platform helps you process information faster, retain more, and make connections between concepts more effectively.
            </p>
            <p className="text-foreground/80 mb-4">
              By converting dense academic text into visual knowledge maps, we enable you to quickly grasp the structure, 
              methodology, and key findings of papers without the cognitive load of traditional linear reading.
            </p>
            <ul className="list-disc pl-6 mb-6 text-foreground/80 space-y-2">
              <li><span className="font-medium">Faster comprehension</span> - Grasp the main concepts and structure in minutes</li>
              <li><span className="font-medium">Better retention</span> - Visual formats improve memory and recall</li>
              <li><span className="font-medium">Deeper understanding</span> - Explore relationships between concepts</li>
              <li><span className="font-medium">Interactive learning</span> - Chat with your papers to clarify understanding</li>
            </ul>
            <p className="text-foreground/80">
              MapMyPaper helps researchers, academics, and students process information more efficiently, 
              allowing you to focus on generating insights and advancing your work rather than getting 
              bogged down in information processing.
            </p>
            <div className="mt-6">
              <Link to="/about" className="text-primary hover:underline">Learn more about Scidart Academy →</Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PdfUpload;
