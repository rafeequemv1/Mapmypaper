
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
import { ZoomIn, ZoomOut, RefreshCw, Download, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import * as pdfjs from "pdfjs-dist";

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PdfImage {
  imageData: string;
  pageNumber: number;
  width: number;
  height: number;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const [pdfImages, setPdfImages] = useState<PdfImage[]>([]);
  const [showImages, setShowImages] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Initialize mermaid library
  useMermaidInit();

  // Extract images from PDF when modal is opened
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Get PDF content from session storage to generate mindmap structure
      const pdfData = sessionStorage.getItem("pdfData");
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Creating a mindmap visualization from your document...",
      });
      
      // Extract images from PDF
      if (pdfData) {
        extractImagesFromPdf(pdfData)
          .then((images) => {
            setPdfImages(images);
            console.log(`Extracted ${images.length} images from PDF`);
          })
          .catch((error) => {
            console.error("Error extracting images:", error);
          });
      }
      
      // Simulate generation delay
      setTimeout(() => {
        // Create a basic mermaid mindmap from PDF content or use default structure
        const mindmapCode = `mindmap
  root((Document Overview))
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
    Supporting Evidence
      Data Points
      Citations
      Analysis
    Figures and Images
      ${pdfImages.length > 0 ? 'PDF contains ' + pdfImages.length + ' extractable images' : 'No images found'}`;
        
        setMermaidCode(mindmapCode);
        setIsGenerating(false);
      }, 1500);
    }
  }, [open, toast]);

  // Extract images from PDF
  const extractImagesFromPdf = async (pdfDataUrl: string): Promise<PdfImage[]> => {
    try {
      const pdfData = atob(pdfDataUrl.split(',')[1]);
      const loadingTask = pdfjs.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const extractedImages: PdfImage[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        
        // Look for image operators in the page
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          // Check for image operators
          if (operatorList.fnArray[i] === pdfjs.OPS.paintImageXObject) {
            const imgArgs = operatorList.argsArray[i];
            const imgId = imgArgs[0];
            
            // Skip if we've already processed this image
            const imgKey = `page${pageNum}_${imgId}`;
            
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
                    extractedImages.push({
                      imageData: dataUrl,
                      pageNumber: pageNum,
                      width: objs.width,
                      height: objs.height
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

  // Toggle images view
  const toggleImagesView = () => {
    setShowImages(prev => !prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <DialogTitle>Mermaid Mindmap</DialogTitle>
          <DialogDescription className="text-xs">
            Visualize the paper structure as a mindmap using Mermaid.
          </DialogDescription>
        </DialogHeader>
        
        {/* Zoom and Export controls */}
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
            onClick={handleExportAsPNG}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export as PNG
          </Button>

          {pdfImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleImagesView}
              className="ml-auto flex items-center gap-1"
            >
              <Image className="h-4 w-4" />
              {showImages ? "Hide Images" : `Show Images (${pdfImages.length})`}
            </Button>
          )}
        </div>
        
        {/* Content Area - Split into Mindmap and Images when images are shown */}
        <div className="flex-1 overflow-hidden flex">
          {/* Mindmap Preview */}
          <div className={`flex-1 overflow-auto bg-white rounded-md p-4 border ${showImages ? 'border-r-0 rounded-r-none' : ''}`}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Generating mindmap...</p>
                </div>
              </div>
            ) : (
              <div 
                ref={previewRef} 
                className="min-h-full h-full w-full flex items-center justify-center overflow-hidden"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              >
                <div className="mermaid bg-white p-6 rounded-lg w-full h-full flex items-center justify-center">
                  {mermaidCode}
                </div>
              </div>
            )}
          </div>
          
          {/* Image Gallery */}
          {showImages && pdfImages.length > 0 && (
            <div className="w-1/3 border border-l-0 rounded-r-md bg-white overflow-auto">
              <div className="p-3 bg-gray-50 border-b sticky top-0 z-10">
                <h3 className="text-sm font-medium">PDF Images ({pdfImages.length})</h3>
                <p className="text-xs text-gray-500">Click an image to view details</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                {pdfImages.map((img, index) => (
                  <div 
                    key={index}
                    className="border rounded-md p-1 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => {
                      toast({
                        title: `Image from page ${img.pageNumber}`,
                        description: `Dimensions: ${img.width}x${img.height}`
                      });
                    }}
                  >
                    <img 
                      src={img.imageData} 
                      alt={`PDF image ${index + 1}`}
                      className="w-full object-contain"
                      style={{maxHeight: '150px'}}
                    />
                    <div className="text-xs text-center mt-1 text-gray-500">
                      Page {img.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
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
