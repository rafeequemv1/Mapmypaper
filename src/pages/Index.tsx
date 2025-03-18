
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, Download, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMapGenerated, setIsMapGenerated] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }
    setFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const generateMindmap = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsMapGenerated(true);
      toast({
        title: "Mindmap generated",
        description: "Your mindmap has been successfully created",
      });
    }, 2000);
  };

  const downloadMindmap = () => {
    toast({
      title: "Download started",
      description: "Your mindmap is being downloaded",
    });
    // In a real app, this would trigger the actual download
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">PaperMind Mapper</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Transform Research Papers into Mindmaps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your academic paper and convert complex information into an intuitive, 
              visual mindmap that highlights key concepts and relationships.
            </p>
          </div>

          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-10 transition-colors mb-8 ${
              file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <FileUp className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload your research paper</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Drag and drop your PDF here, or click the button below
                </p>
              </div>
              <div>
                <label htmlFor="file-upload">
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => document.getElementById('file-upload')?.click()}>
                    <FileUp className="h-4 w-4" />
                    Select PDF
                  </Button>
                </label>
              </div>
              {file && (
                <p className="text-sm font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-10">
            <Button 
              onClick={generateMindmap} 
              disabled={!file || isProcessing}
              className="gap-2"
            >
              {isProcessing ? "Processing..." : "Generate Mindmap"}
            </Button>
            {isMapGenerated && (
              <Button 
                variant="outline" 
                onClick={downloadMindmap}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Mindmap
              </Button>
            )}
          </div>

          {/* Mindmap Preview */}
          {isMapGenerated && (
            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium mb-4 text-center">Your Mindmap</h3>
              <div className="aspect-ratio rounded-md bg-muted p-4 relative overflow-hidden">
                <div className="flex items-center justify-center h-full">
                  <div className="mindmap-preview text-left">
                    <div className="mb-4 bg-primary/10 p-3 rounded-lg">
                      <h4 className="font-semibold">Main Research Topic</h4>
                    </div>
                    <div className="pl-8 mb-2">
                      <div className="bg-accent/50 p-2 rounded-md mb-2 w-4/5">
                        <p className="font-medium">Key Finding #1</p>
                      </div>
                      <div className="pl-6">
                        <div className="bg-muted p-2 rounded-md mb-1 w-3/5">Supporting Evidence</div>
                        <div className="bg-muted p-2 rounded-md w-3/4">Methodology</div>
                      </div>
                    </div>
                    <div className="pl-8 mb-2">
                      <div className="bg-accent/50 p-2 rounded-md mb-2 w-5/6">
                        <p className="font-medium">Key Finding #2</p>
                      </div>
                      <div className="pl-6">
                        <div className="bg-muted p-2 rounded-md mb-1 w-2/3">Data Analysis</div>
                        <div className="bg-muted p-2 rounded-md w-1/2">Conclusion</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 text-sm text-muted-foreground">
                This is a simplified preview. Download for the full interactive mindmap.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              PaperMind Mapper — Transform research into visual knowledge
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

export default Index;
