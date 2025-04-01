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
import { useToast } from "@/hooks/use-toast";

interface TreemapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TreemapModal = ({ open, onOpenChange }: TreemapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // State for theme and editor visibility
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate treemap mindmap when modal opens
  useEffect(() => {
    if (open && !initialGeneration) {
      setIsGenerating(true);
      
      try {
        // Try to get existing mind map data from session storage
        const mindMapData = sessionStorage.getItem('mindMapData');
        let parsedData;
        
        try {
          parsedData = mindMapData ? JSON.parse(mindMapData) : null;
        } catch (e) {
          console.error("Failed to parse mind map data:", e);
          parsedData = null;
        }
        
        // Generate Mermaid mindmap syntax
        let treemapCode = "mindmap\n";
        
        if (parsedData && parsedData.nodeData) {
          const rootNode = parsedData.nodeData;
          
          // Add root node
          treemapCode += `  root((${rootNode.topic.replace(/[\n\r]/g, ' ')}))\n`;
          
          // Helper function to recursively add nodes
          const addNodesRecursively = (node: any, parent: string, depth: number) => {
            if (!node.children) return;
            
            const indent = "  ".repeat(depth + 1);
            
            node.children.forEach((child: any, index: number) => {
              // Clean topic text
              const cleanTopic = child.topic
                .replace(/[\n\r]/g, ' ')  // Remove line breaks
                .replace(/^\p{Emoji}\s*/u, '')  // Remove emoji
                .replace(/['"]/g, '') // Remove quotes
                .trim();
                
              const nodeId = `${parent}_${index}`;
              
              // Choose different node styles
              let nodeStyle = '';
              if (depth === 1) {
                // First level: rounded rectangle
                nodeStyle = `[${cleanTopic}]`;
              } else if (depth === 2) {
                // Second level: stadium shape
                nodeStyle = `(${cleanTopic})`;
              } else if (depth === 3) {
                // Third level: hexagon
                nodeStyle = `{{${cleanTopic}}}`;
              } else {
                // Other levels: cloud
                nodeStyle = `::${cleanTopic}`;
              }
              
              treemapCode += `${indent}${parent} --> ${nodeId}${nodeStyle}\n`;
              
              // Recursively process children
              if (child.children && child.children.length > 0) {
                addNodesRecursively(child, nodeId, depth + 1);
              }
            });
          };
          
          // Start recursive node addition
          addNodesRecursively(rootNode, "root", 1);
        } else {
          // If no data, create a simple example mindmap
          treemapCode += `
  root((Paper Structure))
    root --> root_0[Introduction]
      root_0 --> root_0_0(Background)
      root_0 --> root_0_1(Problem Statement)
    root --> root_1[Methodology]
      root_1 --> root_1_0(Experimental Setup)
      root_1 --> root_1_1(Analysis Techniques)
    root --> root_2[Results]
      root_2 --> root_2_0{{Key Findings}}
      root_2 --> root_2_1{{Statistical Analysis}}
    root --> root_3[Discussion]
      root_3 --> root_3_0::Implications
      root_3 --> root_3_1::Limitations
    root --> root_4[Conclusion]
`;
        }
        
        setCode(treemapCode);
        setInitialGeneration(true);
        
      } catch (error) {
        console.error("Error generating treemap:", error);
        setError(`Failed to generate treemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast({
          title: "Error",
          description: "Failed to generate treemap visualization",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    }
  }, [open, initialGeneration, toast]);

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
          <DialogTitle>Mind Map Tree Visualization</DialogTitle>
          <DialogDescription className="text-xs">
            Alternate tree-based visualization of your mind map using Mermaid.js
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreemapModal;
