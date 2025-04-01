
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
import { Activity } from "lucide-react";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useMindmapGenerator from "./flowchart/useMindmapGenerator";

interface MindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MindmapModal = ({ open, onOpenChange }: MindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateMindmap, handleCodeChange } = useMindmapGenerator();
  
  // State for theme and editor visibility
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap only once when modal is first opened
  useEffect(() => {
    if (open && !initialGeneration) {
      // Generate mindmap with the root node set as "title"
      // This will ensure the first node is always the title
      generateMindmap();
      setInitialGeneration(true);
    }
  }, [open, generateMindmap, initialGeneration]);

  // Toggle color theme
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Manual regeneration handler
  const handleRegenerate = () => {
    generateMindmap();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mindmap</DialogTitle>
          <DialogDescription>
            Visualize the paper structure as a mindmap.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end items-center gap-4 mb-4">
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Regenerate Mindmap"}
          </Button>
        </div>
        
        {/* Preview - Takes up all space */}
        <div className="flex-1 overflow-hidden">
          <FlowchartPreview
            code={code}
            error={error}
            isGenerating={isGenerating}
            theme={theme}
            previewRef={previewRef}
          />
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
