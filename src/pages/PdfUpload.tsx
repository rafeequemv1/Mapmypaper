
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Sparkles, Upload } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">MindMap Generator</h1>
          <p className="text-zinc-400 mb-6">
            Upload a PDF to generate an interactive mind map visualization
          </p>
          
          <div className="flex justify-center mb-8">
            <VideoDialog 
              videoUrl="https://www.youtube.com/watch?v=2eVkAsHy0KM"
              title="How It Works"
              description="Watch a quick demo of our mind map generation capabilities"
              triggerText="Watch Demo"
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-zinc-500" />
                  <p className="mb-1 text-sm text-zinc-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-zinc-600">PDF (MAX. 10MB)</p>
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
                <p className="text-sm text-zinc-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Generating...
                </span>
              ) : (
                "Generate Mind Map"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;
