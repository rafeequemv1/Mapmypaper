
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
        description: "Creating a mindmap visualization from your document...",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap with specific content from your document.
          </DialogDescription>
        </DialogHeader>
        
        {/* Preview - Takes up all space */}
        <div className="flex-1 overflow-hidden">
          <FlowchartPreview
            code={code}
            error={error}
            isGenerating={isGenerating}
            theme={theme}
            previewRef={previewRef}
            hideEditor={true}
          />
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} onToggleTheme={toggleTheme} />
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-black">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MindmapModal;
