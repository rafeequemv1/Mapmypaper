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
  
  // Initialize mermaid library with left-to-right direction
  useMermaidInit("LR");

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
            .replace(/[\(\)']/g, '');
            
          treemapCode += `  root((${rootTopic}))\n`;
          
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
              
              // Add style definition at the bottom
              if (!treemapCode.includes(classDeclaration)) {
                treemapCode += `${indent}%% ${classDeclaration}\n`;
              }
              
              // Recursively process children
              if (child.children && child.children.length > 0) {
                addNodesRecursively(child, nodeId, depth + 1);
              }
            });
          };
          
          // Add style for root - IMPORTANT: Add after defining root node
          treemapCode += `  class root rootStyle\n`;
          treemapCode += `  %% classDef rootStyle fill:#9b87f5,stroke:#6E59A5,stroke-width:2px,color:white,font-weight:bold\n`;
          
          // Start recursive node addition
          addNodesRecursively(rootNode, "root", 1);
          
        } else {
          // If no data, create a colorful example mindmap
          treemapCode += `
  root((Paper Structure))
  
  root --> root_0["Introduction"]
  class root_0 style1_0
  
  root_0 --> root_0_0("Background")
  class root_0_0 style2_0
  
  root_0 --> root_0_1("Problem Statement")
  class root_0_1 style2_1
  
  root --> root_1["Methodology"]
  class root_1 style1_1
  
  root_1 --> root_1_0("Experimental Setup")
  class root_1_0 style2_2
  
  root_1 --> root_1_1("Analysis Techniques")
  class root_1_1 style2_3
  
  root --> root_2["Results"]
  class root_2 style1_2
  
  root_2 --> root_2_0{{"Key Findings"}}
  class root_2_0 style3_0
  
  root_2 --> root_2_1{{"Statistical Analysis"}}
  class root_2_1 style3_1
  
  root --> root_3["Discussion"]
  class root_3 style1_3
  
  root_3 --> root_3_0>"Implications"]
  class root_3_0 style4_0
  
  root_3 --> root_3_1>"Limitations"]
  class root_3_1 style4_1
  
  root --> root_4["Conclusion"]
  class root_4 style1_4
  
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
  %% classDef style4_1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C
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
