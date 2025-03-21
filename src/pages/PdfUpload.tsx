
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Upload, Brain, ChevronRight, LogOut } from "lucide-react";
import VideoDialog from "@/components/ui/video-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      // Store only PDF file name in sessionStorage for the mindmap page
      sessionStorage.setItem("pdfFileName", selectedFile.name);
      
      // Read the file as text instead of base64 to reduce size
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          try {
            // Extract text only from PDF content to reduce storage size
            const pdfText = event.target.result as string;
            const truncatedText = pdfText.substring(0, 1000000); // Limit to 1MB
            sessionStorage.setItem("pdfText", truncatedText);
            
            // For PDF viewer, use a smaller chunk or URL
            try {
              // Create a URL for the PDF file instead of storing the data
              const pdfUrl = URL.createObjectURL(selectedFile);
              sessionStorage.setItem("pdfUrl", pdfUrl);
            } catch (urlError) {
              console.warn("Could not create object URL, falling back to truncated data");
              sessionStorage.setItem("pdfData", pdfText.substring(0, 500000));
            }
            
            // Navigate to mindmap page
            navigate("/mindmap");
          } catch (storageError) {
            console.error("Storage error:", storageError);
            toast({
              title: "Storage Error",
              description: "The PDF is too large. Try a smaller file or extract key sections.",
              variant: "destructive"
            });
          }
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the PDF file.",
          variant: "destructive"
        });
        setIsUploading(false);
      };
      
      // Read as text instead of DataURL to reduce size
      reader.readAsText(selectedFile);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: "There was a problem processing your PDF.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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
      <header className="w-full bg-black text-white py-4 px-6">
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
            
            {/* Upload Section - Moved to the top as requested */}
            <section id="upload" className="bg-gray-50 rounded-lg p-8 shadow-sm">
              <div className="max-w-md mx-auto space-y-6">
                <h2 className="text-2xl font-semibold text-center">Upload Your Research Paper</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="pdf-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
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
                    {selectedFile && (
                      <p className="text-sm text-gray-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!selectedFile || isUploading}
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
            
            <div className="flex justify-center gap-4">
              <VideoDialog 
                videoUrl="https://www.youtube.com/watch?v=2eVkAsHy0KM"
                title="How It Works"
                description="See how our tool transforms research papers into interactive visual maps"
                triggerText="Watch Demo"
              />
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
