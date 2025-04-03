
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
import * as pdfjs from "pdfjs-dist";

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface TreemapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PdfImage {
  imageData: string;
  pageNumber: number;
  width: number;
  height: number;
  caption?: string;
}

const TreemapModal = ({ open, onOpenChange }: TreemapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [pdfImages, setPdfImages] = useState<PdfImage[]>([]);
  
  // State for theme and zoom
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('forest');
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.8); // Start with 80% zoom for better fit
  
  // Initialize mermaid library with left-to-right direction
  useMermaidInit("LR");

  // Show code syntax in error state so user can see the issue
  const [showSyntax, setShowSyntax] = useState(false);

  // Extract images with captions from PDF
  const extractImagesWithCaptions = async (pdfDataUrl: string): Promise<PdfImage[]> => {
    try {
      const pdfData = atob(pdfDataUrl.split(',')[1]);
      const loadingTask = pdfjs.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const extractedImages: PdfImage[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        const textContent = await page.getTextContent();
        
        // Extract all text items with their positions for caption analysis
        const textItems = textContent.items.map(item => ({
          text: 'str' in item ? item.str : '',
          x: 'transform' in item ? item.transform[4] : 0,
          y: 'transform' in item ? item.transform[5] : 0,
          height: 'height' in item ? item.height : 0,
          width: 'width' in item ? item.width : 0
        }));
        
        // Look for image operators in the page
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          // Check for image operators
          if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
            const imgArgs = operatorList.argsArray[i];
            const imgId = imgArgs[0];
            
            try {
              // Get the image data
              const objs = await page.objs.get(imgId);
              
              if (objs && objs.data && objs.width && objs.height) {
                // Create canvas to convert image data to data URL
                const canvas = document.createElement('canvas');
                canvas.width = objs.width;
                canvas.height = objs.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Create ImageData object
                  const imgData = new ImageData(
                    new Uint8ClampedArray(objs.data),
                    objs.width,
                    objs.height
                  );
                  ctx.putImageData(imgData, 0, 0);
                  
                  // Get image as data URL
                  const dataUrl = canvas.toDataURL('image/png');
                  
                  // Only add if image is not too small (likely not a meaningful figure)
                  if (objs.width > 100 && objs.height > 100) {
                    // Try to find caption by looking for text positioned below the image
                    const potentialCaptions = findPotentialCaptions(textItems, objs);
                    
                    extractedImages.push({
                      imageData: dataUrl,
                      pageNumber: pageNum,
                      width: objs.width,
                      height: objs.height,
                      caption: potentialCaptions.length > 0 ? potentialCaptions.join(" ") : undefined
                    });
                  }
                }
              }
            } catch (error) {
              console.error(`Error processing image ${imgId} on page ${pageNum}:`, error);
            }
          }
        }
      }
      
      return extractedImages;
    } catch (error) {
      console.error('Error extracting images from PDF:', error);
      return [];
    }
  };
  
  // Find potential captions by analyzing text positioned near an image
  const findPotentialCaptions = (textItems: any[], imgObj: any): string[] => {
    const captions: string[] = [];
    
    for (let i = 0; i < textItems.length; i++) {
      const text = textItems[i].text.trim();
      
      // Skip empty text
      if (!text) continue;
      
      // Check for caption patterns
      if (
        text.match(/^(figure|fig\.?|table|diagram|chart)\s*\d+/i) || 
        text.match(/^(figure|fig\.?|table|diagram|chart):/i)
      ) {
        // Found potential caption start, collect this and following text
        let captionText = text;
        let j = i + 1;
        
        // Collect continuation text
        while (j < textItems.length && 
              !textItems[j].text.match(/^(figure|fig\.?|table|diagram|chart)\s*\d+/i) &&
              Math.abs(textItems[j].y - textItems[i].y) < 20) {
          captionText += " " + textItems[j].text.trim();
          j++;
        }
        
        captions.push(captionText);
        i = j - 1; // Skip processed items
      }
    }
    
    return captions;
  };

  // Generate treemap mindmap when modal opens
  useEffect(() => {
    if (open && !initialGeneration) {
      setIsGenerating(true);
      
      try {
        // Get PDF data for image extraction
        const pdfDataUrl = sessionStorage.getItem("pdfData");
        
        if (pdfDataUrl) {
          // Extract images with captions from PDF
          extractImagesWithCaptions(pdfDataUrl)
            .then(images => {
              setPdfImages(images);
              console.log(`Extracted ${images.length} images from PDF for treemap`);
            })
            .catch(error => {
              console.error("Error extracting images:", error);
            });
        }
        
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
          
          // Helper function to recursively add nodes with color classes and insert images where appropriate
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
              
              // Check if this node should have an image associated based on content
              const relevantImage = findRelevantImageForTopic(cleanTopic, pdfImages);
              if (relevantImage && child.children && child.children.length > 0) {
                // Create an image node as a child of this node
                const imageNodeId = `${nodeId}_img`;
                const imgCaption = relevantImage.caption ? 
                  relevantImage.caption.length > 30 ? relevantImage.caption.substring(0, 30) + "..." : relevantImage.caption 
                  : `Image from page ${relevantImage.pageNumber}`;
                
                // Add the image reference as a special node
                treemapCode += `${indent}  ${nodeId} --> ${imageNodeId}>"${imgCaption}"]\n`;
                treemapCode += `${indent}  class ${imageNodeId} image\n`;
                
                // Add image class if not already defined
                if (!treemapCode.includes("classDef image")) {
                  treemapCode += `${indent}  %% classDef image fill:#FFEDED,stroke:#FF5050,stroke-width:1px,color:#1A1F2C,font-style:italic\n`;
                }
              }
              
              // Recursively process children
              if (child.children && child.children.length > 0) {
                addNodesRecursively(child, nodeId, depth + 1);
              }
            });
          };
          
          // Find a relevant image for a given topic
          const findRelevantImageForTopic = (topic: string, images: PdfImage[]): PdfImage | null => {
            if (!images.length) return null;
            
            const lowerTopic = topic.toLowerCase();
            const keywords = lowerTopic.split(/\s+/).filter(word => word.length > 3);
            
            // Find image with caption that matches the topic keywords
            const matchedImage = images.find(img => {
              if (!img.caption) return false;
              
              const lowerCaption = img.caption.toLowerCase();
              return keywords.some(keyword => lowerCaption.includes(keyword));
            });
            
            return matchedImage || null;
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
  }, [open, initialGeneration, toast, pdfImages]);

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
            Tree-based visualization of your mind map with integrated document images
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
