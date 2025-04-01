
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
import FlowchartEditor from "./flowchart/FlowchartEditor";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useFlowchartGenerator, { defaultFlowchart } from "./flowchart/useFlowchartGenerator";
import useSequenceDiagramGenerator from "./flowchart/useSequenceDiagramGenerator";
import { Activity, Network, GitBranch, Maximize, Minimize } from "lucide-react";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  const sequenceDiagramGenerator = useSequenceDiagramGenerator();
  
  // State for diagram type, theme, and display mode
  const [diagramType, setDiagramType] = useState<'flowchart' | 'sequence'>('flowchart');
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [hideEditor, setHideEditor] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Currently active diagram code, error and generator based on diagram type
  const activeCode = diagramType === 'flowchart' ? code : sequenceDiagramGenerator.code;
  const activeError = diagramType === 'flowchart' ? error : sequenceDiagramGenerator.error;
  const activeIsGenerating = diagramType === 'flowchart' ? isGenerating : sequenceDiagramGenerator.isGenerating;

  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open) {
      if (code === defaultFlowchart && diagramType === 'flowchart') {
        generateFlowchart();
      } else if (diagramType === 'sequence') {
        sequenceDiagramGenerator.generateDiagram();
      }
    }
  }, [open, diagramType, generateFlowchart, code]);

  // Handle code change based on active diagram type
  const handleActiveDiagramCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (diagramType === 'flowchart') {
      handleCodeChange(e);
    } else {
      sequenceDiagramGenerator.handleCodeChange(e);
    }
  };

  // Handle regenerate based on active diagram type
  const handleRegenerateActiveDiagram = () => {
    if (diagramType === 'flowchart') {
      generateFlowchart();
    } else {
      sequenceDiagramGenerator.generateDiagram();
    }
  };

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
  
  // Toggle fullscreen preview
  const toggleFullScreen = () => {
    setFullScreenPreview(!fullScreenPreview);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${fullScreenPreview ? 'max-w-[98vw] w-[98vw] h-[98vh]' : 'max-w-7xl w-[95vw] h-[90vh]'} flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Diagram Editor</DialogTitle>
          <DialogDescription>
            {diagramType === 'flowchart' ? 
              "Create and edit detailed flowcharts visualizing processes and relationships." : 
              "Create and edit sequence diagrams showing interactions between components."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center gap-4 mb-4">
          <div className="flex gap-2">
            <Button
              variant={diagramType === 'flowchart' ? "default" : "outline"}
              size="sm"
              onClick={() => setDiagramType('flowchart')}
              className="flex items-center gap-1"
            >
              <GitBranch className="h-4 w-4" />
              Flowchart
            </Button>
            <Button
              variant={diagramType === 'sequence' ? "default" : "outline"}
              size="sm"
              onClick={() => setDiagramType('sequence')}
              className="flex items-center gap-1"
            >
              <Network className="h-4 w-4" />
              Sequence
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullScreen}
              className="flex items-center gap-1"
            >
              {fullScreenPreview ? (
                <><Minimize className="h-4 w-4" /> Compact View</>
              ) : (
                <><Maximize className="h-4 w-4" /> Full Screen</>
              )}
            </Button>
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
        </div>
        
        <div className={`grid ${hideEditor ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4 flex-1 overflow-hidden`}>
          {/* Code editor - conditionally rendered based on hideEditor */}
          {!hideEditor && (
            <div className="flex flex-col">
              <FlowchartEditor
                code={activeCode}
                error={activeError}
                isGenerating={activeIsGenerating}
                onCodeChange={handleActiveDiagramCodeChange}
                onRegenerate={handleRegenerateActiveDiagram}
              />
            </div>
          )}
          
          {/* Preview - Takes up all space when editor is hidden */}
          <div className={`${hideEditor ? 'col-span-1' : 'md:col-span-2'} flex flex-col`}>
            <FlowchartPreview
              code={activeCode}
              error={activeError}
              isGenerating={activeIsGenerating}
              theme={theme}
              previewRef={previewRef}
              hideEditor={hideEditor}
              fitGraph={true}
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

export default FlowchartModal;
