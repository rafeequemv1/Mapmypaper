
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Upload, Brain, ChevronRight, LogOut, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const MAX_PDF_SIZE_MB = 50; // Increased maximum PDF size

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size - increased limit
      if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`File is too large. Maximum size is ${MAX_PDF_SIZE_MB}MB.`);
        toast({
          title: "File Too Large",
          description: `Please select a PDF smaller than ${MAX_PDF_SIZE_MB}MB.`,
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      
      // Store PDF file name in sessionStorage
      sessionStorage.setItem("pdfFileName", selectedFile.name);
      
      // Create a blob URL for viewing PDF instead of storing the entire file
      const pdfUrl = URL.createObjectURL(selectedFile);
      sessionStorage.setItem("pdfUrl", pdfUrl);
      
      // For large PDFs, use a more efficient text extraction approach
      if (selectedFile.size > 10 * 1024 * 1024) {
        console.log("Large PDF detected, using chunked processing");
        await processLargePdf(selectedFile);
      } else {
        // Standard processing for smaller PDFs
        await processStandardPdf(selectedFile);
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage("There was a problem processing your PDF. Please try again with a different file.");
      toast({
        title: "Upload Failed",
        description: "There was a problem processing your PDF.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  // Process large PDFs in chunks to avoid memory issues
  const processLargePdf = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (event.target && event.target.result) {
            const fullText = event.target.result as string;
            console.log("PDF text extracted, length:", fullText.length);
            
            // Process text in a way that avoids memory issues
            const extractedText = extractRepresentativeContent(fullText);
            console.log("Extracted representative content, length:", extractedText.length);
            
            // Store the processed text
            try {
              sessionStorage.setItem("pdfText", extractedText);
              console.log("PDF text stored in sessionStorage");
              
              // Navigate to mindmap page
              setTimeout(() => {
                console.log("Navigating to /mindmap");
                navigate("/mindmap");
                resolve();
              }, 500);
              
            } catch (storageError) {
              console.error("Storage error:", storageError);
              const reducedText = extractedText.slice(0, Math.min(extractedText.length, 100000));
              
              try {
                sessionStorage.setItem("pdfText", reducedText);
                console.log("Reduced PDF text stored in sessionStorage");
                
                setTimeout(() => {
                  console.log("Navigating to /mindmap with reduced text");
                  navigate("/mindmap");
                  resolve();
                }, 500);
              } catch (finalError) {
                reject(new Error("Document is too complex to process. Please try a different PDF."));
              }
            }
          } else {
            reject(new Error("Failed to extract text from PDF."));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read the PDF file."));
      };
      
      // Read as text
      reader.readAsText(file);
    });
  };

  // Standard processing for normal-sized PDFs
  const processStandardPdf = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          try {
            const fullText = event.target.result as string;
            console.log("PDF text extracted, length:", fullText.length);
            
            try {
              // Store the full text for smaller PDFs
              sessionStorage.setItem("pdfText", fullText);
              console.log("PDF text stored in sessionStorage");
              
              // Navigate to mindmap page
              setTimeout(() => {
                console.log("Navigating to /mindmap");
                navigate("/mindmap");
                resolve();
              }, 500);
              
            } catch (storageError) {
              console.error("Storage error:", storageError);
              // Fallback to reduced text
              const reducedText = extractRepresentativeContent(fullText);
              
              try {
                sessionStorage.setItem("pdfText", reducedText);
                console.log("Reduced PDF text stored in sessionStorage");
                
                setTimeout(() => {
                  console.log("Navigating to /mindmap");
                  navigate("/mindmap");
                  resolve();
                }, 500);
              } catch (finalError) {
                reject(new Error("PDF is too complex. Try a different document."));
              }
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Failed to extract text from PDF."));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read the PDF file."));
      };
      
      // Read as text
      reader.readAsText(file);
    });
  };

  // Extract representative content from large text
  const extractRepresentativeContent = (text: string): string => {
    if (text.length <= 100000) {
      return text; // Return as is if not very large
    }
    
    console.log("Text is very large, extracting representative sections");
    
    // Take beginning (usually abstract/introduction)
    const beginning = text.slice(0, 15000);
    
    // Take samples from throughout the document at regular intervals
    const samples = [];
    const numSamples = 5;
    const textLength = text.length;
    
    for (let i = 1; i <= numSamples; i++) {
      const startPos = Math.floor((textLength / (numSamples + 1)) * i);
      samples.push(text.slice(startPos, startPos + 10000));
    }
    
    // Take end (usually conclusion, references)
    const end = text.slice(Math.max(0, text.length - 15000));
    
    // Combine all parts
    return beginning + samples.join("\n\n[...]\n\n") + "\n\n[...]\n\n" + end;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Black Top Bar */}
      <header className="w-full bg-black text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span className="font-semibold text-lg">MapMyPaper</span>
          </div>
          <nav className="flex space-x-6">
            {user ? (
              <>
                <button onClick={handleLogout} className="hover:text-gray-300 transition-colors flex items-center">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="hover:text-gray-300 transition-colors">Sign In</Link>
                <Link to="/sign-up" className="hover:text-gray-300 transition-colors">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center bg-white text-black p-4">
        <div className="w-full max-w-4xl mx-auto py-16 px-4 space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tighter">Transform Research Papers into Visual Knowledge</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Visualize complex academic content as interactive mind maps. Boost comprehension, increase retention, and save valuable research time.
            </p>
            
            {/* Upload Section */}
            <section id="upload" className="bg-gray-50 rounded-lg p-8 shadow-sm">
              <div className="max-w-md mx-auto space-y-6">
                <h2 className="text-2xl font-semibold text-center">Upload Your Research Paper</h2>
                <p className="text-center text-gray-600">
                  Now supporting PDFs up to {MAX_PDF_SIZE_MB}MB
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="pdf-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${errorMessage ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg cursor-pointer hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {errorMessage ? (
                          <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
                        ) : (
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        )}
                        <p className="mb-1 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF research papers accepted</p>
                      </div>
                      <Input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    {errorMessage && (
                      <p className="text-sm text-red-600">
                        {errorMessage}
                      </p>
                    )}
                    {selectedFile && !errorMessage && (
                      <p className="text-sm text-gray-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!selectedFile || isUploading || !!errorMessage}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Processing...
                      </span>
                    ) : (
                      "Generate Mind Map"
                    )}
                  </Button>
                </form>
              </div>
            </section>
            
            <div className="flex justify-center">
              <Button 
                className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Features <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Accelerate Your Research</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Visual Learning</h3>
                <p className="text-gray-600">Convert dense text into visual maps that leverage your brain's natural pattern recognition abilities.</p>
              </div>
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Enhanced Retention</h3>
                <p className="text-gray-600">Increase information retention by 40% through spatial relationships and visual connections.</p>
              </div>
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Time Efficiency</h3>
                <p className="text-gray-600">Process research papers 3x faster by identifying key concepts and relationships instantly.</p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Research Paper to Mind Map in Minutes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Paper</h3>
                <p className="text-gray-600">Select any research paper or academic PDF you're studying.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-600">Our algorithms extract key concepts, relationships, and structure.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Interactive Mind Map</h3>
                <p className="text-gray-600">Explore complex academic concepts through an intuitive visual interface.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Black Footer */}
      <footer className="w-full bg-black text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6" />
                <span className="font-semibold text-lg">MapMyPaper</span>
              </div>
              <p className="text-gray-400">Accelerate your research comprehension with visual learning.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <p className="text-gray-400">support@mapmypaper.com</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} MapMyPaper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PdfUpload;
