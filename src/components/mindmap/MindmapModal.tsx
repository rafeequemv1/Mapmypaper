
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
import FlowchartEditor from "./flowchart/FlowchartEditor";
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
  const [hideEditor, setHideEditor] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap when modal is opened
  useEffect(() => {
    if (open) {
      generateMindmap();
    }
  }, [open, generateMindmap]);

  // Toggle color theme
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Toggle editor visibility
  const toggleEditor = () => {
    setHideEditor(!hideEditor);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mindmap Editor</DialogTitle>
          <DialogDescription>
            Create and edit mindmaps to organize concepts and ideas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditor}
            className="flex items-center gap-1"
          >
            <Activity className="h-4 w-4" />
            {hideEditor ? "Show Editor" : "Hide Editor"}
          </Button>
        </div>
        
        <div className={`grid ${hideEditor ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4 flex-1 overflow-hidden`}>
          {/* Code editor - conditionally rendered based on hideEditor */}
          {!hideEditor && (
            <div className="flex flex-col">
              <FlowchartEditor
                code={code}
                error={error}
                isGenerating={isGenerating}
                onCodeChange={handleCodeChange}
                onRegenerate={generateMindmap}
              />
            </div>
          )}
          
          {/* Preview - Takes up all space when editor is hidden */}
          <div className={`${hideEditor ? 'col-span-1' : 'md:col-span-2'} flex flex-col`}>
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
              theme={theme}
              previewRef={previewRef}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <FlowchartExport previewRef={previewRef} onToggleTheme={toggleTheme} />
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MindmapModal;
