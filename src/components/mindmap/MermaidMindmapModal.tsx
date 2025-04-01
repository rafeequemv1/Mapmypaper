
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
import { ZoomIn, ZoomOut, RefreshCw, Download, Code, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import * as pdfjs from "pdfjs-dist";
import { Textarea } from "@/components/ui/textarea";
import FlowchartPreview from "./flowchart/FlowchartPreview";

// Set the worker source with HTTPS to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PdfImage {
  imageData: string;
  pageNumber: number;
  width: number;
  height: number;
  caption?: string;
  relevantTopics?: string[];
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const [pdfImages, setPdfImages] = useState<PdfImage[]>([]);
  const { toast } = useToast();
  const [showSyntax, setShowSyntax] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  
  // Initialize mermaid library
  useMermaidInit();

  // Extract images from PDF and analyze captions when modal is opened
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Get PDF content from session storage to generate mindmap structure
      const pdfData = sessionStorage.getItem("pdfData");
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Creating a mindmap visualization with integrated images from your document...",
      });
      
      // Extract images from PDF
      if (pdfData) {
        extractImagesWithCaptions(pdfData)
          .then((images) => {
            setPdfImages(images);
            console.log(`Extracted ${images.length} images from PDF with caption analysis`);
          })
          .catch((error) => {
            console.error("Error extracting images:", error);
            setError(`Error extracting images: ${error instanceof Error ? error.message : String(error)}`);
          });
      }
      
      // Generate mindmap
      setTimeout(() => {
        generateMindmapWithImages(pdfData);
        setIsGenerating(false);
      }, 1500);
    }
  }, [open, toast]);

  // Generate mindmap with embedded images
  const generateMindmapWithImages = (pdfData: string | null) => {
    try {
      // Create a basic structure from PDF content or use default structure
      // Starting code for the mindmap
      let mindmapCode = `mindmap
  root((Document Overview))`;
      
      // Add structure sections
      mindmapCode += `
    Document Structure
      Introduction
      Methodology
      Results
      Discussion
      Conclusion
    Key Concepts
      Concept 1
      Concept 2
      Concept 3
    Supporting Evidence`;
      
      // Add image sections based on extracted images and their potential topic relevance
      if (pdfImages.length > 0) {
        mindmapCode += `
    Figures and Images`;
        
        // Group images by their likely content categories
        const categories = analyzeAndCategorizeImages(pdfImages);
        
        // Add images to appropriate categories
        Object.entries(categories).forEach(([category, images]) => {
          if (images.length > 0) {
            mindmapCode += `
      ${category}`;
            
            // Add individual image references (limited to first 3 per category)
            images.slice(0, 3).forEach((img, idx) => {
              mindmapCode += `
        Image ${img.pageNumber}-${idx+1} from page ${img.pageNumber}`;
            });
          }
        });
      }
      
      setMermaidCode(mindmapCode);
    } catch (error) {
      console.error("Error generating mindmap with images:", error);
      // Fallback to simple mindmap
      setMermaidCode(`mindmap
  root((Document Overview))
    Document Structure
      Introduction
      Methodology
      Results
      Discussion
    Figures
      ${pdfImages.length > 0 ? `${pdfImages.length} images were found but couldn't be categorized` : 'No images found'}`);
      
      setError(`Error generating mindmap: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Analyze and categorize images based on position in document and text context
  const analyzeAndCategorizeImages = (images: PdfImage[]): Record<string, PdfImage[]> => {
    const categories: Record<string, PdfImage[]> = {
      "Charts & Graphs": [],
      "Diagrams": [],
      "Photos": [],
      "Tables": [],
      "Other Visuals": []
    };
    
    // Simple heuristic categorization based on image properties
    images.forEach(img => {
      // Aspect ratio and size as simple heuristics
      const aspectRatio = img.width / img.height;
      
      if (img.caption) {
        const caption = img.caption.toLowerCase();
        
        // Use caption text to improve categorization
        if (caption.includes("chart") || caption.includes("graph") || caption.includes("plot")) {
          categories["Charts & Graphs"].push(img);
        } 
        else if (caption.includes("diagram") || caption.includes("flow") || caption.includes("model")) {
          categories["Diagrams"].push(img);
        }
        else if (caption.includes("table") || caption.includes("tabular") || (aspectRatio > 1.5 && img.width > 300)) {
          categories["Tables"].push(img);
        }
        else if (caption.includes("photo") || caption.includes("picture") || caption.includes("image")) {
          categories["Photos"].push(img);
        }
        else {
          categories["Other Visuals"].push(img);
        }
      } 
      else {
        // Categorize based on size and aspect ratio if no caption
        if (aspectRatio > 2 || aspectRatio < 0.5) {
          categories["Tables"].push(img); // Very wide or tall images are likely tables
        }
        else if (img.width < 200 || img.height < 200) {
          categories["Charts & Graphs"].push(img); // Small images might be icons or small charts
        }
        else {
          categories["Other Visuals"].push(img);
        }
      }
    });
    
    return categories;
  };

  // Enhanced image extraction with caption analysis
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
                    // This is a simple heuristic - text near the image that might be a caption
                    const potentialCaptions = findPotentialCaptions(textItems, objs);
                    
                    extractedImages.push({
                      imageData: dataUrl,
                      pageNumber: pageNum,
                      width: objs.width,
                      height: objs.height,
                      caption: potentialCaptions.length > 0 ? potentialCaptions.join(" ") : undefined,
                      relevantTopics: deriveTopicsFromCaption(potentialCaptions.join(" "))
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
    // Estimate image position based on limited information
    // This is an approximation since PDF.js doesn't give us exact positioning
    const imgY = 0; // We don't have this information directly
    
    // Look for text that might be captions
    // Common patterns: "Figure X:", "Table X:", text that starts with "Fig."
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
        
        // Collect continuation text (usually captions span multiple text items)
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
  
  // Derive potential topics from caption text
  const deriveTopicsFromCaption = (caption: string): string[] => {
    if (!caption) return [];
    
    const topics: string[] = [];
    const captionLower = caption.toLowerCase();
    
    // Extract key terms that might indicate topic relevance
    const keyTerms = [
      { term: "method", topic: "Methodology" },
      { term: "approach", topic: "Methodology" },
      { term: "result", topic: "Results" },
      { term: "finding", topic: "Results" },
      { term: "data", topic: "Results" },
      { term: "analysis", topic: "Discussion" },
      { term: "performance", topic: "Results" },
      { term: "accuracy", topic: "Results" },
      { term: "model", topic: "Methodology" },
      { term: "framework", topic: "Methodology" },
      { term: "architecture", topic: "Methodology" },
      { term: "comparison", topic: "Discussion" },
      { term: "overview", topic: "Introduction" },
      { term: "system", topic: "Methodology" },
      { term: "process", topic: "Methodology" },
      { term: "workflow", topic: "Methodology" },
      { term: "conclusion", topic: "Conclusion" }
    ];
    
    // Check if caption contains any key terms
    keyTerms.forEach(({ term, topic }) => {
      if (captionLower.includes(term) && !topics.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics;
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Handle export as PNG
  const handleExportAsPNG = async () => {
    if (!previewRef.current) return;
    
    try {
      const canvas = await html2canvas(previewRef.current);
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'mermaid-mindmap.png';
      link.click();
      
      toast({
        title: "Export successful",
        description: "Mermaid mindmap exported as PNG"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export mindmap",
        variant: "destructive"
      });
    }
  };
  
  // Toggle syntax view
  const toggleSyntaxView = () => {
    setShowSyntax(!showSyntax);
  };
  
  // Handle code changes in the editor
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMermaidCode(e.target.value);
  };
  
  // Toggle through themes
  const toggleTheme = () => {
    const themes: Array<'default' | 'forest' | 'dark' | 'neutral'> = ['default', 'forest', 'dark', 'neutral'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap using Mermaid with integrated images.
          </DialogDescription>
        </DialogHeader>
        
        {/* Toolbar with toggle, zoom and export controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSyntaxView}
            className="flex items-center gap-1"
          >
            {showSyntax ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
            {showSyntax ? "Show Preview" : "Show Syntax"}
          </Button>
          
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
            title="Reset zoom"
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
            onClick={toggleTheme}
            className="ml-2"
          >
            Theme: {theme}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportAsPNG}
            className="flex items-center gap-1 ml-auto"
          >
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>
        </div>
        
        {/* Mindmap Preview or Editor */}
        <div className="flex-1 overflow-hidden">
          {showSyntax ? (
            <div className="h-full flex flex-col">
              <Textarea
                value={mermaidCode}
                onChange={handleCodeChange}
                placeholder="Enter your Mermaid mindmap code here..."
                className="flex-1 font-mono text-sm resize-none p-4 h-full"
              />
              {error && (
                <div className="mt-2 text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Generating mindmap with integrated images...</p>
                  </div>
                </div>
              ) : (
                <FlowchartPreview
                  code={mermaidCode}
                  error={error}
                  isGenerating={false}
                  theme={theme}
                  previewRef={previewRef}
                  zoomLevel={zoomLevel}
                />
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MermaidMindmapModal;
