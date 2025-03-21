
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Upload, Brain, ChevronRight } from "lucide-react";
import VideoDialog from "@/components/ui/video-dialog";

const PdfUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

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
      // This is a mock - in a real app, you'd upload the file to a server
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/mindmap");
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
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
            <Link to="/sign-in" className="hover:text-gray-300 transition-colors">Sign In</Link>
            <Link to="/sign-up" className="hover:text-gray-300 transition-colors">Sign Up</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center bg-white text-black p-4">
        <div className="w-full max-w-4xl mx-auto py-16 px-4 space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tighter">Transform PDFs into Interactive Mind Maps</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your PDF documents and instantly generate beautiful, interactive mind maps to visualize complex information.
            </p>
            
            <div className="flex justify-center gap-4">
              <VideoDialog 
                videoUrl="https://www.youtube.com/watch?v=2eVkAsHy0KM"
                title="How It Works"
                description="Watch a quick demo of our mind map generation capabilities"
                triggerText="Watch Demo"
              />
              <Button 
                className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
                onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Upload Section */}
          <section id="upload" className="bg-gray-50 rounded-lg p-8 shadow-sm">
            <div className="max-w-md mx-auto space-y-6">
              <h2 className="text-2xl font-semibold text-center">Upload Your PDF</h2>
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
                      <p className="text-xs text-gray-500">PDF files accepted</p>
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
                      Generating...
                    </span>
                  ) : (
                    "Create Mind Map"
                  )}
                </Button>
              </form>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Instant Visualization</h3>
                <p className="text-gray-600">Transform complex documents into clear, navigable mind maps in seconds.</p>
              </div>
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
                <p className="text-gray-600">Our algorithms identify key concepts and relationships automatically.</p>
              </div>
              <div className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Interactive Navigation</h3>
                <p className="text-gray-600">Explore connections, expand nodes, and dive deeper into the content.</p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="space-y-8">
            <h2 className="text-3xl font-bold text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Upload Your PDF</h3>
                <p className="text-gray-600">Select any PDF document you want to analyze.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
                <p className="text-gray-600">Our algorithms analyze the content and structure.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Explore Your Mind Map</h3>
                <p className="text-gray-600">Navigate through the interactive visualization.</p>
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
              <p className="text-gray-400">Transform your PDFs into interactive mind maps instantly.</p>
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
