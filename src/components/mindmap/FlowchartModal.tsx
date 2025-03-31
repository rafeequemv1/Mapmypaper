
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
import useMindmapGenerator from "./flowchart/useMindmapGenerator";
import { Activity, Network, GitBranch, Sigma } from "lucide-react";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  const sequenceDiagramGenerator = useSequenceDiagramGenerator();
  const mindmapGenerator = useMindmapGenerator();
  
  // State for diagram type and theme
  const [diagramType, setDiagramType] = useState<'flowchart' | 'sequence' | 'mindmap'>('flowchart');
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [hideEditor, setHideEditor] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Currently active diagram code, error and generator based on diagram type
  const activeCode = 
    diagramType === 'flowchart' ? code : 
    diagramType === 'sequence' ? sequenceDiagramGenerator.code :
    mindmapGenerator.code;
  
  const activeError = 
    diagramType === 'flowchart' ? error : 
    diagramType === 'sequence' ? sequenceDiagramGenerator.error :
    mindmapGenerator.error;
  
  const activeIsGenerating = 
    diagramType === 'flowchart' ? isGenerating : 
    diagramType === 'sequence' ? sequenceDiagramGenerator.isGenerating :
    mindmapGenerator.isGenerating;

  // Generate diagram when modal is opened or diagram type changes
  useEffect(() => {
    if (open) {
      if (code === defaultFlowchart && diagramType === 'flowchart') {
        generateFlowchart();
      } else if (diagramType === 'sequence' && sequenceDiagramGenerator.code === '') {
        sequenceDiagramGenerator.generateDiagram();
      } else if (diagramType === 'mindmap' && mindmapGenerator.code === mindmapGenerator.defaultMindmap) {
        mindmapGenerator.generateMindmap();
      }
    }
  }, [open, diagramType, generateFlowchart, code, sequenceDiagramGenerator, mindmapGenerator]);

  // Handle code change based on active diagram type
  const handleActiveDiagramCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (diagramType === 'flowchart') {
      handleCodeChange(e);
    } else if (diagramType === 'sequence') {
      sequenceDiagramGenerator.handleCodeChange(e);
    } else {
      mindmapGenerator.handleCodeChange(e);
    }
  };

  // Handle regenerate based on active diagram type
  const handleRegenerateActiveDiagram = () => {
    if (diagramType === 'flowchart') {
      generateFlowchart();
    } else if (diagramType === 'sequence') {
      sequenceDiagramGenerator.generateDiagram();
    } else {
      mindmapGenerator.generateMindmap();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Diagram Editor</DialogTitle>
          <DialogDescription>
            {diagramType === 'flowchart' ? 
              "Create and edit flowcharts visualizing processes and relationships." : 
              diagramType === 'sequence' ?
              "Create and edit sequence diagrams showing interactions between components." :
              "Create and edit mind maps to organize ideas and concepts."}
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
            <Button
              variant={diagramType === 'mindmap' ? "default" : "outline"}
              size="sm"
              onClick={() => setDiagramType('mindmap')}
              className="flex items-center gap-1"
            >
              <Sigma className="h-4 w-4" />
              Mind Map
            </Button>
          </div>
          
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
