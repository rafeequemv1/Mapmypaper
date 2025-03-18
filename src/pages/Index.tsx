
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import MindMapViewer from "@/components/MindMapViewer";

const Index = () => {
  const [isMapGenerated, setIsMapGenerated] = useState(true); // Start with the map already generated
  const { toast } = useToast();

  useEffect(() => {
    // Show toast when component mounts to indicate the mindmap is ready
    toast({
      title: "Mindmap loaded",
      description: "Your mindmap is ready to use"
    });
  }, []);

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
          <div>
            <Button 
              variant="outline" 
              onClick={downloadMindmap}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Mindmap
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Research Paper Mindmap</h2>
            <p className="text-muted-foreground">
              Visualize key concepts and relationships from your research paper
            </p>
          </div>

          {/* Mind Elixir Mindmap */}
          <MindMapViewer isMapGenerated={isMapGenerated} />
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
