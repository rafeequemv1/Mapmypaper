
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useMindmapGenerator from "./flowchart/useMindmapGenerator";
import { useToast } from "@/hooks/use-toast";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface MindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MindmapModal = ({ open, onOpenChange }: MindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateMindmap, handleCodeChange } = useMindmapGenerator();
  const { toast } = useToast();
  
  // State for theme and editor visibility
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8); // Start with 80% zoom for better fit
  const [showSyntax, setShowSyntax] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap only once when modal is first opened
  useEffect(() => {
    if (open && !initialGeneration) {
      // Generate mindmap with specific content from the document
      generateMindmap();
      setInitialGeneration(true);
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mindmap",
        description: "Creating a detailed mindmap visualization from your document...",
      });
    }
  }, [open, generateMindmap, initialGeneration, toast]);

  // Toggle color theme
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(0.8); // Reset to fit diagram
  };
  
  const toggleSyntax = () => {
    setShowSyntax(!showSyntax);
  };
  
  // Auto-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      // Reset zoom to ensure diagram fits
      setZoomLevel(0.8);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a detailed mindmap with key content and relationships from your document.
          </DialogDescription>
        </DialogHeader>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="flex items-center gap-1"
            title="Reset zoom to fit diagram"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center gap-1"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSyntax}
            className="ml-auto"
          >
            {showSyntax ? "Hide Syntax" : "Show Syntax"}
          </Button>
        </div>
        
        {/* Preview - Takes up all space */}
        <div className="flex-1 overflow-hidden">
          {showSyntax ? (
            <div className="h-full w-full overflow-auto bg-gray-100 p-4 rounded-md">
              <pre className="text-xs">{code}</pre>
            </div>
          ) : (
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
              theme={theme}
              previewRef={previewRef}
              hideEditor={true}
              zoomLevel={zoomLevel}
            />
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} onToggleTheme={toggleTheme} />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MindmapModal;
