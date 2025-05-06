import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw, Maximize, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf, generateMindmapFromPdf } from "@/services/geminiService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import mermaid from "mermaid";
import html2canvas from "html2canvas";
import { downloadBlob } from "@/utils/downloadUtils";
import PdfTabs, { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

// Initialize mermaid with specific settings for mindmap
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  securityLevel: 'loose',
  fontSize: 16
});

interface FlowchartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPdfKey?: string | null;
}

type DiagramType = 'flowchart' | 'mindmap';

const FlowchartModal = ({ open, onOpenChange, currentPdfKey }: FlowchartModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [diagramCode, setDiagramCode] = useState<string>("");
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  // Store diagram codes by PDF key and type for instant switching
  // Using a Record with properly typed null values to avoid TypeScript errors
  const [diagramCodeCache, setDiagramCodeCache] = useState<Record<string, Record<DiagramType, string | null>>>({});
  
  // Add state for active PDF key
  const [activePdfKey, setActivePdfKey] = useState<string | null>(() => {
    const metas = getAllPdfs();
    if (metas.length === 0) return null;
    return getPdfKey(metas[0]);
  });

  // Update activePdfKey when currentPdfKey prop changes
  useEffect(() => {
    if (currentPdfKey && currentPdfKey !== activePdfKey) {
      setActivePdfKey(currentPdfKey);
    }
  }, [currentPdfKey]);

  // Listen for tab changes from outside this component
  useEffect(() => {
    const handlePdfTabChanged = (event: CustomEvent) => {
      if (event.detail?.activeKey) {
        setActivePdfKey(event.detail.activeKey);
        
        // Force re-render if forceUpdate flag is set
        if (event.detail?.forceUpdate) {
          const cachedDiagram = diagramCodeCache[event.detail.activeKey]?.[diagramType];
          if (cachedDiagram) {
            setDiagramCode(cachedDiagram);
            setTimeout(() => renderDiagram(), 100);
          }
        }
      }
    };
    
    window.addEventListener('pdfTabChanged', handlePdfTabChanged as EventListener);
    
    return () => {
      window.removeEventListener('pdfTabChanged', handlePdfTabChanged as EventListener);
    };
  }, [diagramCodeCache, diagramType]);

  // Generate diagram when the modal is opened or type changes or PDF changes
  useEffect(() => {
    if (open && activePdfKey) {
      // Check if we have cached data for this PDF and diagram type
      const cachedDiagram = diagramCodeCache[activePdfKey]?.[diagramType];
      
      if (cachedDiagram) {
        // If cached data exists, use it immediately
        setDiagramCode(cachedDiagram);
      } else {
        // Otherwise generate new diagram
        generateDiagram();
      }
    }
  }, [open, diagramType, activePdfKey]);

  // Render diagram whenever the code changes
  useEffect(() => {
    if (diagramCode && open && diagramRef.current) {
      renderDiagram();
    }
  }, [diagramCode, open]);

  // Generate diagram based on selected type
  const generateDiagram = async () => {
    if (!activePdfKey) return;
    
    setIsLoading(true);
    try {
      let mermaidCode;
      if (diagramType === 'flowchart') {
        mermaidCode = await generateFlowchartFromPdf();
        // Ensure flowchart is LR (left to right)
        if (mermaidCode.includes('flowchart TD') || mermaidCode.includes('flowchart TB')) {
          mermaidCode = mermaidCode.replace(/flowchart (TD|TB)/, 'flowchart LR');
        }
      } else {
        mermaidCode = await generateMindmapFromPdf();
        // Fix common mindmap formatting issues
        mermaidCode = fixMindmapFormat(mermaidCode);
      }
      
      // Update the diagram code
      setDiagramCode(mermaidCode);
      
      // Cache the diagram code for future use
      setDiagramCodeCache(prev => {
        const updatedCache = { ...prev };
        
        // Initialize the PDF entry if it doesn't exist
        if (!updatedCache[activePdfKey]) {
          updatedCache[activePdfKey] = {
            flowchart: null,
            mindmap: null
          };
        }
        
        // Update the specific diagram type
        updatedCache[activePdfKey][diagramType] = mermaidCode;
        
        return updatedCache;
      });
      
    } catch (error) {
      console.error(`Error generating ${diagramType}:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${diagramType}. Please try again.`,
        variant: "destructive",
      });
      // Set fallback diagram
      setDiagramCode(diagramType === 'flowchart'
        ? `flowchart LR\n  A[Error] --> B[Generation Failed]\n  B --> C[Please try again]`
        : `mindmap\n  root((Error))\n    Failed to generate mindmap\n      Please try again`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fix common mindmap formatting issues with improved parsing
  const fixMindmapFormat = (code: string): string => {
    if (!code) return code;
    
    // Fix common mindmap issues
    let fixed = code;
    
    // Remove any trailing text that would break the mindmap syntax
    fixed = fixed.replace(/memraid mindmap issue/g, '');
    fixed = fixed.replace(/mermaid mindmap issue/g, '');
    fixed = fixed.replace(/memraid/g, '');
    fixed = fixed.replace(/mermaid mindmap issue/g, '');
    
    // Make sure mindmap declaration is properly set
    if (!fixed.trim().startsWith('mindmap')) {
      fixed = 'mindmap\n' + fixed.trim();
    }
    
    // Process each line for proper indentation and format
    const lines = fixed.split('\n');
    const fixedLines: string[] = [];
    let inRoot = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimRight(); // Remove trailing spaces but keep leading indentation
      
      // Skip empty lines but keep the mindmap declaration
      if (!line.trim()) {
        continue;
      }
      
      // Keep the mindmap declaration as is
      if (line.trim() === 'mindmap') {
        fixedLines.push(line);
        continue;
      }
      
      // Fix root line if needed - ensure it has proper double parentheses
      if (line.trim().startsWith('root') && !inRoot) {
        inRoot = true;
        if (!line.includes('((') && !line.includes('))')) {
          line = line.replace(/root\s*\(([^)]*)\)/, 'root(($1))');
        }
        if (!line.includes('((')) {
          line = line.replace(/root\s*/, 'root((');
        }
        if (!line.includes('))')) {
          line = line + '))';
        }
        fixedLines.push(line);
        continue;
      }
      
      // Fix indentation - ensure proper increments of 2 spaces
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      if (leadingSpaces % 2 !== 0) {
        const correctedSpaces = Math.round(leadingSpaces / 2) * 2;
        line = ' '.repeat(correctedSpaces) + line.trimLeft();
      }
      
      fixedLines.push(line);
    }
    
    // Filter out any unwanted text after the mindmap content
    let result = fixedLines.join('\n');
    
    // Clean up trailing text that's not part of the mindmap syntax
    const mindmapEndRegex = /("Swelling transition"[^"]*")/;
    const match = result.match(mindmapEndRegex);
    if (match && match.index) {
      result = result.substring(0, match.index + match[1].length);
    }
    
    return result;
  };

  // Render the diagram using mermaid with enhanced error handling
  const renderDiagram = async () => {
    if (!diagramRef.current) return;

    try {
      // Clear the container first
      diagramRef.current.innerHTML = '';
      
      // Create a unique ID for this render
      const id = `diagram-${Date.now()}`;
      
      // Create a container with the unique ID
      const container = document.createElement('div');
      container.id = id;
      container.className = 'mermaid';
      
      // For mindmaps, add full-screen style
      if (diagramType === 'mindmap') {
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '60vh';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
      } else {
        // For flowcharts, ensure it stays within the canvas
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflow = 'auto';
      }
      
      // Pre-process diagram code before rendering
      let processedCode = diagramCode;
      if (diagramType === 'mindmap') {
        // Ensure proper mindmap format with extra check
        processedCode = fixMindmapFormat(processedCode);
      }
      
      container.textContent = processedCode;
      
      // Add to the DOM
      diagramRef.current.appendChild(container);
      
      // Render with mermaid
      await mermaid.run({
        nodes: [container]
      });
      
      // For mindmap, find the SVG and make it full size
      if (diagramType === 'mindmap') {
        const svg = container.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.maxHeight = '60vh';
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
        }
      } else if (diagramType === 'flowchart') {
        // For flowcharts, ensure SVG fits within container
        const svg = container.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        }
      }
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      
      // Improved error handling with details
      if (diagramRef.current) {
        // Create a more useful error message with the diagram code
        diagramRef.current.innerHTML = `
          <div class="p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 class="text-red-500 font-medium mb-2">Error rendering diagram</h3>
            <p class="mb-4">There's an issue with the diagram syntax. Common problems include:</p>
            <ul class="list-disc pl-5 mb-4 text-sm">
              <li>Incorrect indentation in mindmaps</li>
              <li>Special characters in node text</li>
              <li>Missing or extra spaces</li>
              <li>Trailing text at the end of the diagram</li>
            </ul>
            <p class="font-medium mb-2">Diagram code:</p>
            <pre class="text-xs overflow-auto p-2 bg-gray-100 rounded border border-gray-300">${diagramCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        `;
      }
    }
  };

  // Handle diagram type change
  const handleDiagramTypeChange = (value: DiagramType) => {
    if (value !== diagramType) {
      setDiagramType(value);
      
      // Check if we have cached data for this diagram type and PDF
      const cachedDiagram = diagramCodeCache[activePdfKey as string]?.[value];
      
      if (cachedDiagram) {
        // Use cached diagram immediately
        setDiagramCode(cachedDiagram);
      } else {
        // Otherwise clear and generate new
        setDiagramCode("");
      }
    }
  };

  // Handle PDF tab change
  const handlePdfChange = (key: string) => {
    setActivePdfKey(key);
    
    // Dispatch an event to inform other components about tab change
    window.dispatchEvent(
      new CustomEvent('pdfTabChanged', { 
        detail: { 
          activeKey: key,
          forceUpdate: true
        } 
      })
    );
    
    // Check if we have cached data for this PDF and current diagram type
    const cachedDiagram = diagramCodeCache[key]?.[diagramType];
    
    if (cachedDiagram) {
      // Use cached diagram immediately 
      setDiagramCode(cachedDiagram);
      // Ensure re-rendering
      setTimeout(() => renderDiagram(), 200);
    } else {
      // Clear and generate new diagram
      setDiagramCode("");
    }
  };

  // Download the diagram as PNG
  const downloadDiagram = async () => {
    if (!diagramRef.current) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating image from diagram...",
      });
      
      // Capture the diagram as canvas
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = diagramType === 'flowchart' ? "paper_flowchart.png" : "paper_mindmap.png";
          downloadBlob(blob, fileName);
          toast({
            title: "Download Complete",
            description: `${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} has been downloaded as PNG.`,
          });
        }
      });
    } catch (error) {
      console.error("Error downloading diagram:", error);
      toast({
        title: "Download Failed",
        description: "Could not create download. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  // Function to manually update diagram code
  const updateDiagramCode = (code: string) => {
    // Verify the code has the correct starting syntax based on type
    if (diagramType === 'mindmap' && !code.trim().startsWith('mindmap')) {
      code = 'mindmap\n' + code;
    } else if (diagramType === 'flowchart' && !code.trim().startsWith('flowchart')) {
      code = 'flowchart LR\n' + code;
    }
    
    setDiagramCode(code);
    
    // Update cache
    if (activePdfKey) {
      setDiagramCodeCache(prev => {
        const updatedCache = { ...prev };
        if (!updatedCache[activePdfKey]) {
          updatedCache[activePdfKey] = {
            flowchart: null,
            mindmap: null
          };
        }
        updatedCache[activePdfKey][diagramType] = code;
        return updatedCache;
      });
    }
    
    // Render after a short delay
    setTimeout(() => renderDiagram(), 100);
  };

  // Get well-formatted default example based on diagram type
  const getDefaultExample = (): string => {
    if (diagramType === 'mindmap') {
      return `mindmap
  root((Neutron Reflectometry Study))
    Introduction
      Polyelectrolyte multilayers
      Swelling in solvents
    Methodology
      PSS and pDADMAC polyelectrolytes
      Neutron reflectometry
    Results
      Film thickness increases
      Swelling increases with humidity`;
    } else {
      return `flowchart LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Process 1]
  B -->|No| D[Process 2]
  C --> E[End]
  D --> E`;
    }
  };

  // Fixed working mindmap example for neutron reflectometry study
  const neutronStudyExample = `mindmap
  root((Neutron Reflectometry Study))
    Introduction
      Polyelectrolyte multilayers
      Swelling in solvents
    Methodology
      PSS and pDADMAC polyelectrolytes
      Neutron reflectometry
    Results
      Film thickness increases
      Swelling increases with humidity`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullScreen ? 'max-w-[100vw] w-screen h-screen max-h-screen rounded-none' : 'max-w-[90vw] max-h-[90vh]'} overflow-hidden flex flex-col`}
      >
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-xl">
            <span>Paper Visualization</span>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={downloadDiagram}
                className="flex gap-1 text-sm"
                variant="outline"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={generateDiagram}
                disabled={isLoading}
                className="flex gap-1 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleFullScreen}
                className="flex gap-1 text-sm"
              >
                {isFullScreen ? (
                  <>
                    <Minimize className="h-4 w-4" />
                    Exit Full Screen
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    Full Screen
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* PDF tabs */}
        <div className="mb-1">
          <PdfTabs
            activeKey={activePdfKey}
            onTabChange={handlePdfChange}
            onRemove={() => {}} // We don't want to allow removal from this modal
          />
        </div>

        <div className="flex items-center justify-center mb-4 mt-2">
          <RadioGroup 
            className="flex gap-4" 
            value={diagramType} 
            onValueChange={(value) => handleDiagramTypeChange(value as DiagramType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flowchart" id="flowchart" />
              <label htmlFor="flowchart" className="text-sm font-medium leading-none cursor-pointer">
                Flowchart
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mindmap" id="mindmap" />
              <label htmlFor="mindmap" className="text-sm font-medium leading-none cursor-pointer">
                Mind Map
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Custom diagram editor for troubleshooting */}
        {diagramType === 'mindmap' && (
          <div className="bg-gray-50 p-2 mb-4 rounded-md">
            <p className="text-sm mb-2">Having rendering issues? Try this mindmap format:</p>
            <pre className="text-xs bg-white p-2 border rounded cursor-pointer" 
              onClick={() => updateDiagramCode(neutronStudyExample)}>
{neutronStudyExample}
</pre>
            <p className="text-xs text-gray-500 mt-1">Click the example above to use it as a template.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] p-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <p className="text-center text-muted-foreground text-lg">
              Generating {diagramType} from paper content...
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              This may take a moment as we analyze the document structure.
            </p>
          </div>
        ) : (
          <div className={`flex-1 overflow-auto py-4 relative ${isFullScreen ? 'h-full' : ''}`}>
            <div 
              ref={diagramRef} 
              className={`flex justify-center items-center ${diagramType === 'mindmap' ? 'w-full h-full min-h-[65vh]' : 'w-full min-h-[65vh] overflow-auto'} p-4 bg-white`}
            >
              {!diagramCode && (
                <div className="text-center text-muted-foreground">
                  No diagram generated yet.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
