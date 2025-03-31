
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Maximize2, Minimize2 } from "lucide-react";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate flowchart when modal is opened
  useEffect(() => {
    if (open) {
      if (code === defaultFlowchart) {
        generateFlowchart();
      }
    }
  }, [open, code, generateFlowchart]);

  const handleDetailLevelChange = (level: 'basic' | 'detailed' | 'advanced') => {
    generateFlowchart(level);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isFullscreen) setIsFullscreen(false);
      onOpenChange(newOpen);
    }}>
      <DialogContent className={`${isFullscreen ? 'fixed inset-0 w-full h-full max-w-none rounded-none p-0' : 'max-w-[90vw] w-[95vw] h-[90vh]'} flex flex-col`}>
        {!isFullscreen && (
          <DialogHeader>
            <DialogTitle>Flowchart Editor</DialogTitle>
            <DialogDescription>
              Create and edit flowcharts based on your PDF content.
            </DialogDescription>
          </DialogHeader>
        )}
        
        <div className={`${isFullscreen ? 'p-4' : 'mb-4'} flex items-center gap-2 justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">Detail Level:</span>
            <Select onValueChange={(value) => handleDetailLevelChange(value as 'basic' | 'detailed' | 'advanced')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Detailed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="shrink-0"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4 flex-1 overflow-hidden`}>
          {/* Code editor - Only show in non-fullscreen mode */}
          {!isFullscreen && (
            <div className="flex flex-col">
              <FlowchartEditor
                code={code}
                error={error}
                isGenerating={isGenerating}
                onCodeChange={handleCodeChange}
                onRegenerate={() => generateFlowchart('detailed')}
              />
            </div>
          )}
          
          {/* Preview - Takes full width in fullscreen mode */}
          <div className={`${isFullscreen ? 'col-span-1' : 'md:col-span-2'} flex flex-col`}>
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
            />
          </div>
        </div>
        
        <DialogFooter className={`flex justify-between sm:justify-between ${isFullscreen ? 'p-4' : ''}`}>
          <FlowchartExport previewRef={previewRef} />
          <Button onClick={() => {
            if (isFullscreen) setIsFullscreen(false);
            else onOpenChange(false);
          }}>
            {isFullscreen ? "Exit Fullscreen" : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
