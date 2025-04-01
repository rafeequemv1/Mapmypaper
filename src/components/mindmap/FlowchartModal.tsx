
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
import useFlowchartGenerator, { defaultFlowchart } from "./flowchart/useFlowchartGenerator";
import { Activity, ZoomIn, ZoomOut, MousePointer, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlowchartModal = ({ open, onOpenChange }: FlowchartModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { code, error, isGenerating, generateFlowchart, handleCodeChange } = useFlowchartGenerator();
  
  // State for theme and UI
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [hideEditor, setHideEditor] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Initialize mermaid library with horizontal layout (LR)
  useMermaidInit("LR"); // Explicitly set LR for Left to Right direction
  
  // Generate flowchart when modal is opened or detail level changes
  useEffect(() => {
    if (open && (code === defaultFlowchart || detailLevel !== 'medium')) {
      generateFlowchart(detailLevel);
    }
  }, [open, generateFlowchart, code, detailLevel]);

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
    setZoomLevel(1);
  };

  // Change detail level and regenerate flowchart
  const changeDetailLevel = (level: 'low' | 'medium' | 'high') => {
    setDetailLevel(level);
    generateFlowchart(level);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Flowchart Editor</DialogTitle>
          <DialogDescription>
            Create and edit flowcharts visualizing processes and relationships.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    className="flex items-center gap-1"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomReset}
                    className="flex items-center gap-1"
                  >
                    <MousePointer className="h-4 w-4" />
                    {Math.round(zoomLevel * 100)}%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Zoom</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    className="flex items-center gap-1"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 ml-2"
                >
                  <Palette className="h-4 w-4" />
                  <span>Detail Level: {detailLevel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detail Level</p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant={detailLevel === 'low' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeDetailLevel('low')}
                    >
                      Basic Structure
                    </Button>
                    <Button 
                      variant={detailLevel === 'medium' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeDetailLevel('medium')}
                    >
                      Moderate Detail
                    </Button>
                    <Button 
                      variant={detailLevel === 'high' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => changeDetailLevel('high')}
                    >
                      Comprehensive
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Preview - Takes up all space */}
          <div className="h-full flex flex-col">
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
              theme={theme}
              previewRef={previewRef}
              zoomLevel={zoomLevel}
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
