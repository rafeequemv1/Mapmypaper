
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import FlowchartExport from "./flowchart/FlowchartExport";
import useMermaidInit from "./flowchart/useMermaidInit";
import useFlowchartGenerator, { defaultFlowchart } from "./flowchart/useFlowchartGenerator";
import useMindmapGenerator from "./flowchart/useMindmapGenerator";
import { GitBranch, Sigma } from "lucide-react";
import ApiKeyModal from "./ApiKeyModal";
import { checkGeminiAPIKey } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  const mindmapGenerator = useMindmapGenerator();
  
  // State for diagram type and theme
  const [diagramType, setDiagramType] = useState<'flowchart' | 'mindmap'>('flowchart');
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const { toast } = useToast();
  
  // Initialize mermaid library
  useMermaidInit();

  // Check if API key exists and is valid - use the hardcoded key
  useEffect(() => {
    if (open) {
      const setupApiKey = async () => {
        const isValid = await checkGeminiAPIKey();
        setHasValidApiKey(isValid);
        
        if (!isValid) {
          setApiKeyModalOpen(true);
        }
      };
      
      setupApiKey();
    }
  }, [open]);

  // Currently active diagram code, error and generator based on diagram type
  const activeCode = diagramType === 'flowchart' ? code : mindmapGenerator.code;
  const activeError = diagramType === 'flowchart' ? error : mindmapGenerator.error;
  const activeIsGenerating = diagramType === 'flowchart' ? isGenerating : mindmapGenerator.isGenerating;

  // Generate diagram when modal is opened or diagram type changes
  useEffect(() => {
    if (open && hasValidApiKey) {
      if (code === defaultFlowchart && diagramType === 'flowchart') {
        console.log("Initiating flowchart generation");
        generateFlowchart();
      } else if (diagramType === 'mindmap' && mindmapGenerator.code === mindmapGenerator.defaultMindmap) {
        console.log("Initiating mindmap generation");
        mindmapGenerator.generateMindmap();
      }
    }
  }, [open, diagramType, hasValidApiKey, generateFlowchart, code, mindmapGenerator]);

  // Handle regenerate based on active diagram type
  const handleRegenerateActiveDiagram = () => {
    if (!hasValidApiKey) {
      setApiKeyModalOpen(true);
      return;
    }
    
    if (diagramType === 'flowchart') {
      generateFlowchart();
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Research Paper Flowchart</DialogTitle>
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
                variant={diagramType === 'mindmap' ? "default" : "outline"}
                size="sm"
                onClick={() => setDiagramType('mindmap')}
                className="flex items-center gap-1"
              >
                <Sigma className="h-4 w-4" />
                Mind Map
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateActiveDiagram}
                disabled={activeIsGenerating}
              >
                Regenerate
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 flex-1 overflow-hidden">
            {/* Preview - Takes up all space */}
            <div className="col-span-1 flex flex-col">
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
      
      <ApiKeyModal
        open={apiKeyModalOpen} 
        onOpenChange={(open) => {
          setApiKeyModalOpen(open);
          // If modal is closed, check if we now have a valid API key
          if (!open) {
            checkGeminiAPIKey().then(setHasValidApiKey);
          }
        }}
      />
    </>
  );
};

export default FlowchartModal;
