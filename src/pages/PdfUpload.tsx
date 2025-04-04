import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PdfToText from "react-pdftotext";
import { Upload, ExternalLink, Braces, GitBranch, BrainCircuit, MessageSquare, FileDown, Clock, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMindMapFromText } from "@/services/geminiService";
import PaperLogo from "@/components/PaperLogo";
import { Separator } from "@/components/ui/separator";
import { storePDF } from "@/utils/pdfStorage";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";
import { trackPdfUpload, trackFeatureUsage, trackMindMapGeneration, trackEvent } from "@/utils/analytics";
import { useVisualizationContext } from "@/contexts/VisualizationContext";

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
    <div className="min-h-screen flex flex-col bg-[#f8f8f8]">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PaperLogo size="md" />
            <h1 className="text-xl font-medium text-[#333]">mapmypaper</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a>
            
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openVisualization("flowchart")}
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
        <div className="text-center mb-8 mt-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <PaperLogo size="lg" />
            <h1 className="text-4xl font-bold text-[#333]">mapmypaper</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform academic papers into visual knowledge maps. Read research papers faster, 
            increase comprehension, and boost retention with our AI-powered visualization tools.
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
            Perfect for visual learners, researchers, scientists, and students who want to quickly grasp and remember complex information.
          </p>
        </div>
        
        {/* PDF Upload Box */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          {/* Dropzone */}
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
          
          {/* Selected File Info with size warning if needed */}
          {selectedFile && (
            <div className={`p-4 ${pdfSize > 15 * 1024 * 1024 ? 'bg-yellow-50' : 'bg-gray-50'} rounded-lg flex items-center justify-between mb-6`}>
              <p className="font-medium truncate">{selectedFile.name}</p>
              <div className="flex flex-col items-end">
                <p className="text-sm text-gray-500">
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
            className="w-full bg-[#333] hover:bg-[#444] text-white" 
            disabled={!selectedFile || isProcessing}
            size="lg"
          >
            {isProcessing ? "Processing..." : "Generate Mind Map"}
          </Button>
          
          {extractionError && (
            <p className="text-red-500 text-sm mt-4">{extractionError}</p>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Transform How You Process Academic Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F5F3FF] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <BrainCircuit className="h-12 w-12 text-[#8B5CF6] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Mind Maps</h3>
              <p className="text-gray-600">
                Visualize complex papers as intuitive mind maps. Explore relationships between concepts and navigate through ideas effortlessly.
              </p>
            </div>
            
            <div className="bg-[#FEF3C7] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <MessageSquare className="h-12 w-12 text-[#F97316] mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Research Assistant</h3>
              <p className="text-gray-600">
                Chat with your papers. Ask questions, request explanations, and dive deeper into specific sections with our AI-powered assistant.
              </p>
            </div>
            
            <div className="bg-[#DBEAFE] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <GitBranch className="h-12 w-12 text-[#3B82F6] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flowcharts & Diagrams</h3>
              <p className="text-gray-600">
                See methodologies and processes as visual flowcharts. Understand complex procedures and technical sequences at a glance.
              </p>
            </div>
            
            <div className="bg-[#FCE7F3] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <FileDown className="h-12 w-12 text-[#EC4899] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Export & Share</h3>
              <p className="text-gray-600">
                Download visualizations in multiple formats. Share with colleagues, include in presentations, or reference in your own work.
              </p>
            </div>
            
            <div className="bg-[#DCFCE7] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <Clock className="h-12 w-12 text-[#10B981] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Save Time</h3>
              <p className="text-gray-600">
                Process papers in minutes instead of hours. Quick comprehension of key concepts, methodologies, and findings with auto-generated summaries.
              </p>
            </div>
            
            <div className="bg-[#F1F5F9] p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
              <BarChart2 className="h-12 w-12 text-[#6366F1] mb-4" />
              <h3 className="text-xl font-semibold mb-2">Visual Learning</h3>
              <p className="text-gray-600">
                Optimize for visual learners. Increase retention and understanding through multimodal representations of complex academic content.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              MapMyPaper is designed for researchers, students, and academics who need to process large volumes of complex information efficiently.
            </p>
            <Button 
              className="bg-[#333] hover:bg-[#444] text-white"
              size="lg"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              Try It Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <div id="about" className="py-16 bg-[#f8f8f8]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Why MapMyPaper?</h2>
          
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Academic papers shouldn't be a challenge to understand</h3>
            <p className="text-gray-600 mb-4">
              MapMyPaper was built by researchers for researchers. We understand the challenges of parsing through dense academic content and extracting meaningful insights quickly.
            </p>
            <p className="text-gray-600 mb-4">
              Our AI-powered platform transforms complex papers into visual knowledge maps that are intuitive to explore and easy to understand. 
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
              <li><span className="font-medium">Faster comprehension</span> - Grasp the main concepts and structure in minutes</li>
              <li><span className="font-medium">Better retention</span> - Visual formats improve memory and recall</li>
              <li><span className="font-medium">Deeper understanding</span> - Explore relationships between concepts</li>
              <li><span className="font-medium">Interactive learning</span> - Chat with your papers to clarify understanding</li>
            </ul>
            <p className="text-gray-600">
              Whether you're a student, researcher, or professional, MapMyPaper helps you process academic content more efficiently and effectively.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PaperLogo size="sm" />
                <h2 className="text-lg font-medium text-[#333]">mapmypaper</h2>
              </div>
              <p className="text-gray-600 text-sm">
                Transform research papers into interactive mind maps for better comprehension and retention.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a></li>
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="/auth" className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</a></li>
                <li>
                  <a 
                    href="https://blog.mapmypaper.com" 
                    className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Blog <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MapMyPaper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
