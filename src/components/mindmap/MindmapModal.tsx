
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface MindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type DetailLevel = "simple" | "detailed" | "advanced";

const MindmapModal = ({ open, onOpenChange }: MindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("detailed");
  const { code, error, isGenerating, generateMindmap } = useMindmapGenerator();
  
  // State for theme and editor visibility
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // Direction set to LR for better visibility of detailed sub-branches
  useMermaidInit("LR");

  // Generate mindmap when detail level changes or when modal is first opened
  useEffect(() => {
    if (open && (!initialGeneration || detailLevel)) {
      // Generate mindmap with the selected detail level
      generateMindmap(detailLevel);
      setInitialGeneration(true);
    }
  }, [open, generateMindmap, initialGeneration, detailLevel]);

  // Handle detail level change
  const handleDetailLevelChange = (value: DetailLevel) => {
    setDetailLevel(value);
    generateMindmap(value);
  };

  // Toggle color theme
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col font-roboto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Detailed Mindmap</DialogTitle>
            
            {/* Detail level dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {detailLevel === "simple" ? "Simple" : 
                   detailLevel === "detailed" ? "Detailed" : "Advanced"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px] bg-white">
                <DropdownMenuItem onClick={() => handleDetailLevelChange("simple")}>
                  Simple
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDetailLevelChange("detailed")}>
                  Detailed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDetailLevelChange("advanced")}>
                  Advanced
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap. Select detail level to adjust complexity.
          </DialogDescription>
        </DialogHeader>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            -
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomReset}>
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            +
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
            hideEditor={true}
            zoomLevel={zoomLevel}
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
