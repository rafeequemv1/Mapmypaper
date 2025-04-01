
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
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

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
  
  // State for theme and zoom
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8); // Start with 80% zoom for better fit
  
  // Initialize mermaid library with left-to-right direction
  useMermaidInit("LR");

  // Show code syntax in error state so user can see the issue
  const [showSyntax, setShowSyntax] = useState(false);

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
        
        // Generate Mermaid mindmap syntax with better colors and styling
        let treemapCode = "mindmap\n";
        
        if (parsedData && parsedData.nodeData) {
          const rootNode = parsedData.nodeData;
          
          // Add root node - use custom styling
          const rootTopic = rootNode.topic.replace(/[\n\r]/g, ' ')
            .replace(/[-_]/g, ' ')
            .replace(/[\(\)']/g, '')
            .trim();
          
          // Add the root node as the first node with proper syntax  
          treemapCode += `  root((${rootTopic}))\n`;
          
          // Define the rootStyle class but don't apply it yet
          const rootStyleDefinition = "classDef rootStyle fill:#9b87f5,stroke:#6E59A5,stroke-width:2px,color:white,font-weight:bold\n";
          
          // Helper function to recursively add nodes with color classes
          const addNodesRecursively = (node: any, parent: string, depth: number) => {
            if (!node.children) return;
            
            const indent = "  ".repeat(depth + 1);
            
            node.children.forEach((child: any, index: number) => {
              // Clean topic text - remove problematic characters
              const cleanTopic = child.topic
                .replace(/[\n\r]/g, ' ')
                .replace(/[-_]/g, ' ')
                .replace(/[\(\)']/g, '')
                .trim();
                
              const nodeId = `${parent}_${index}`;
              
              // Choose different node styles based on depth
              let nodeStyle = '';
              let classDeclaration = '';
              
              if (depth === 1) {
                // First level: rounded rectangle
                nodeStyle = `["${cleanTopic}"]`;
                classDeclaration = `classDef style${depth}_${index % 5} fill:#E5DEFF,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C`;
              } else if (depth === 2) {
                // Second level: stadium shape
                nodeStyle = `("${cleanTopic}")`;
                classDeclaration = `classDef style${depth}_${index % 5} fill:#F6F6F7,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C`;
              } else if (depth === 3) {
                // Third level: hexagon
                nodeStyle = `{{"${cleanTopic}"}}`;
                classDeclaration = `classDef style${depth}_${index % 5} fill:#FDE1D3,stroke:#F97316,stroke-width:1px,color:#1A1F2C,font-style:italic`;
              } else {
                // Other levels: cloud
                nodeStyle = `>"${cleanTopic}"]`;
                classDeclaration = `classDef style${depth}_${index % 4} fill:#F1F0FB,stroke:#D946EF,stroke-width:1px,color:#1A1F2C`;
              }
              
              treemapCode += `${indent}${parent} --> ${nodeId}${nodeStyle}\n`;
              
              // Add class for styling directly to the node
              treemapCode += `${indent}class ${nodeId} style${depth}_${index % 5}\n`;
              
              // Add style definition at the bottom if it hasn't been added already
              if (!treemapCode.includes(classDeclaration)) {
                treemapCode += `${indent}%% ${classDeclaration}\n`;
              }
              
              // Recursively process children
              if (child.children && child.children.length > 0) {
                addNodesRecursively(child, nodeId, depth + 1);
              }
            });
          };
          
          // Start recursive node addition
          addNodesRecursively(rootNode, "root", 1);
          
          // Apply style for root - IMPORTANT: Add this after all nodes have been defined
          treemapCode += `  class root rootStyle\n`;
          treemapCode += `  %% ${rootStyleDefinition}`;
          
        } else {
          // If no data, create a simple example mindmap with properly formatted syntax
          treemapCode = `mindmap
  root((Paper Structure))
  
  root --> intro["Introduction"]
  class intro style1_0
  
  intro --> background("Background")
  class background style2_0
  
  intro --> problem("Problem Statement")
  class problem style2_1
  
  root --> methods["Methodology"]
  class methods style1_1
  
  methods --> setup("Experimental Setup")
  class setup style2_2
  
  methods --> techniques("Analysis Techniques")
  class techniques style2_3
  
  root --> results["Results"]
  class results style1_2
  
  results --> findings{{"Key Findings"}}
  class findings style3_0
  
  results --> analysis{{"Statistical Analysis"}}
  class analysis style3_1
  
  root --> discussion["Discussion"]
  class discussion style1_3
  
  discussion --> implications>"Implications"]
  class implications style4_0
  
  discussion --> limitations>"Limitations"]
  class limitations style4_1
  
  root --> conclusion["Conclusion"]
  class conclusion style1_4
  
  class root rootStyle
  %% classDef rootStyle fill:#9b87f5,stroke:#6E59A5,stroke-width:2px,color:white,font-weight:bold
  %% classDef style1_0 fill:#E5DEFF,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C
  %% classDef style1_1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C
  %% classDef style1_2 fill:#FDE1D3,stroke:#F97316,stroke-width:1px,color:#1A1F2C
  %% classDef style1_3 fill:#FFDEE2,stroke:#D946EF,stroke-width:1px,color:#1A1F2C
  %% classDef style1_4 fill:#F2FCE2,stroke:#6E59A5,stroke-width:1px,color:#1A1F2C
  %% classDef style2_0 fill:#F6F6F7,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C
  %% classDef style2_1 fill:#F1F0FB,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C
  %% classDef style2_2 fill:#FEF7CD,stroke:#F97316,stroke-width:1px,color:#1A1F2C
  %% classDef style2_3 fill:#FFDEE2,stroke:#D946EF,stroke-width:1px,color:#1A1F2C
  %% classDef style3_0 fill:#E5DEFF,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C,font-style:italic
  %% classDef style3_1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C,font-style:italic
  %% classDef style4_0 fill:#F1F0FB,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C
  %% classDef style4_1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C`;
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
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(0.8); // Reset to fit diagram
  };
  
  const toggleSyntax = () => {
    setShowSyntax(!showSyntax);
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
        
        {/* Toolbar with zoom controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center gap-1"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="flex items-center gap-1"
            title="Reset zoom to fit diagram"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center gap-1"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSyntax}
            className="ml-auto"
          >
            {showSyntax ? "Hide Syntax" : "Show Syntax"}
          </Button>
        </div>
        
        {/* Preview or syntax display */}
        <div className="flex-1 overflow-hidden">
          {showSyntax ? (
            <div className="h-full w-full overflow-auto bg-gray-100 p-4 rounded-md">
              <pre className="text-xs">{code}</pre>
            </div>
          ) : (
            <FlowchartPreview
              code={code}
              error={error}
              isGenerating={isGenerating}
              theme={theme}
              previewRef={previewRef}
              hideEditor={true}
              zoomLevel={zoomLevel}
            />
          )}
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
