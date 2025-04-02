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
import { ZoomIn, ZoomOut, RefreshCw, Download, Code, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useMermaidInit from "./flowchart/useMermaidInit";
import html2canvas from "html2canvas";
import * as pdfjs from "pdfjs-dist";
import { Textarea } from "@/components/ui/textarea";
import FlowchartPreview from "./flowchart/FlowchartPreview";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Set the worker source with HTTPS to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface MermaidMindmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MermaidMindmapModal = ({ open, onOpenChange }: MermaidMindmapModalProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Start with 100% zoom
  const { toast } = useToast();
  const [showSyntax, setShowSyntax] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'default' | 'forest' | 'dark' | 'neutral'>('default');
  
  // Initialize mermaid library
  useMermaidInit();

  // Generate mindmap when modal is opened
  useEffect(() => {
    if (open) {
      setIsGenerating(true);
      
      // Get PDF content from session storage for Gemini analysis
      const pdfData = sessionStorage.getItem("pdfData");
      const pdfText = sessionStorage.getItem("pdfText");
      
      // Show toast when mindmap is being generated
      toast({
        title: "Generating Mermaid Mindmap",
        description: "Creating a detailed mindmap visualization using AI analysis of your document...",
      });
      
      // Call Gemini service to generate the mindmap
      generateMindmapFromPdf()
        .then((response) => {
          if (response) {
            // Process the Gemini-generated mindmap by enhancing it with emojis and styling
            const enhancedMindmap = enhanceMindmapWithEmojis(response);
            setMermaidCode(enhancedMindmap);
          } else {
            // Fallback if Gemini doesn't return a valid response
            setMermaidCode(generateFallbackMindmap(pdfText));
          }
        })
        .catch((err) => {
          console.error("Error generating mindmap:", err);
          setError(err instanceof Error ? err.message : "Unknown error");
          // Fallback to a basic structure
          setMermaidCode(generateFallbackMindmap(pdfText));
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [open, toast]);

  // Function to enhance any mindmap with emojis and better styling
  const enhanceMindmapWithEmojis = (mindmapCode: string): string => {
    // Make sure the code starts with mindmap directive
    if (!mindmapCode.trim().startsWith("mindmap")) {
      mindmapCode = "mindmap\n" + mindmapCode;
    }

    // Split into lines for processing
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    
    // Map of keywords to emojis - expanded for academic paper topics
    const emojiMap: Record<string, string> = {
      'summary': '🔍',
      'introduction': '🚪',
      'background': '📘',
      'method': '⚙️',
      'methodology': '⚙️',
      'approach': '🧪',
      'experiment': '🧪',
      'data': '📊',
      'dataset': '📊',
      'result': '📈',
      'finding': '✨',
      'performance': '⚡',
      'discussion': '💭',
      'implication': '💡',
      'limitation': '🛑',
      'future': '🔮',
      'conclusion': '🏁',
      'reference': '📚',
      'key point': '✨',
      'contribution': '⭐',
      'significance': '💎',
      'design': '🔧',
      'implementation': '⚡',
      'preparation': '🔄',
      'comparison': '🔍',
      'analysis': '📏',
      'theory': '📚',
      'practice': '⚒️',
      'objective': '🎯',
      'hypothesis': '🎯',
      'evaluation': '🔬',
      'research': '🔍',
      'question': '❓',
      'algorithm': '⚙️',
      'parameter': '🔢',
      'model': '🧠',
      'framework': '📐',
      'tool': '🛠️',
      'technique': '⚒️',
      'system': '🔄',
      'component': '🧩',
      'process': '⚙️',
      'step': '👣',
      'topic': '📑',
      'paper': '📄',
      'study': '🔬',
      'test': '🧪',
      'observation': '👁️',
      'idea': '💡',
      'challenge': '⚠️',
      'problem': '⚠️',
      'solution': '🔧',
      'goal': '🎯',
      'measure': '📏',
      'metric': '📊',
      'quantum': '⚛️',
      'physics': '🔭',
      'chemistry': '🧪',
      'biological': '🧬',
      'computation': '💻',
      'enhancement': '📈',
      'spectroscopy': '🌈',
      'photoluminescence': '💫',
      'emission': '✨',
      'nanomaterial': '🔬',
      'resonance': '〰️',
      'polymer': '🧵',
      'surface': '🔳',
      'coating': '🖌️',
      'particle': '⚪',
      'nano': '🔍',
      'quantum dot': '⚛️',
      'plasmonic': '⚡',
      'optical': '👁️',
      'electronic': '💻',
      'synthesis': '🧪',
      'characterization': '🔎',
      'application': '🛠️'
    };

    // Process each line to add emojis and formatting
    for (let line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines, directives, or class definitions
      if (!trimmedLine || trimmedLine === 'mindmap' || trimmedLine.startsWith('class') || trimmedLine.startsWith('%%')) {
        processedLines.push(line);
        continue;
      }
      
      // Skip if already has emoji
      if (/\p{Emoji}/u.test(trimmedLine)) {
        processedLines.push(line);
        continue;
      }
      
      // Extract node text
      let nodeTextMatch = null;
      if (trimmedLine.includes('((') && trimmedLine.includes('))')) {
        // Root node
        nodeTextMatch = trimmedLine.match(/\(\((.*?)\)\)/);
      } else if (trimmedLine.includes('[') && trimmedLine.includes(']')) {
        // Rectangle node
        nodeTextMatch = trimmedLine.match(/\[\"?(.*?)\"?\]/);
      } else if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
        // Round node
        nodeTextMatch = trimmedLine.match(/\(\"?(.*?)\"?\)/);
      } else if (trimmedLine.includes('{') && trimmedLine.includes('}')) {
        // Hexagon node
        nodeTextMatch = trimmedLine.match(/\{\"?(.*?)\"?\}/);
      } else if (trimmedLine.includes('>') && trimmedLine.includes(']')) {
        // Bubble node
        nodeTextMatch = trimmedLine.match(/>\s*\"?(.*?)\"?\]/);
      }
      
      if (nodeTextMatch && nodeTextMatch[1]) {
        const nodeText = nodeTextMatch[1].replace(/^"/, '').replace(/"$/, '');
        const lowerText = nodeText.toLowerCase();
        
        // Find matching emoji
        let emoji = '';
        for (const [keyword, emojiChar] of Object.entries(emojiMap)) {
          if (lowerText.includes(keyword)) {
            emoji = emojiChar + ' ';
            break;
          }
        }
        
        // If no specific emoji found, use a default based on position in mindmap
        if (!emoji) {
          if (trimmedLine.includes('((') && trimmedLine.includes('))')) {
            emoji = '📑 '; // Default for root
          } else {
            emoji = '📌 '; // Default for other nodes
          }
        }
        
        // Replace node text with emoji + text
        if (trimmedLine.includes('((') && trimmedLine.includes('))')) {
          // Root node
          line = line.replace(/\(\((.*?)\)\)/, `(("${emoji}${nodeText}"))`);
        } else if (trimmedLine.includes('[') && trimmedLine.includes(']')) {
          // Rectangle node
          line = line.replace(/\[\s*"?(.*?)"?\s*\]/, `["${emoji}${nodeText}"]`);
        } else if (trimmedLine.includes('(') && trimmedLine.includes(')') && !trimmedLine.includes('((') && !trimmedLine.includes('))')) {
          // Round node
          line = line.replace(/\(\s*"?(.*?)"?\s*\)/, `("${emoji}${nodeText}")`);
        } else if (trimmedLine.includes('{') && trimmedLine.includes('}')) {
          // Hexagon node
          line = line.replace(/\{\s*"?(.*?)"?\s*\}/, `{"${emoji}${nodeText}"}`);
        } else if (trimmedLine.includes('>') && trimmedLine.includes(']')) {
          // Bubble node
          line = line.replace(/>\s*"?(.*?)"?\s*\]/, `>"${emoji}${nodeText}"]`);
        }
      }
      
      processedLines.push(line);
    }
    
    // Add styling classes if not present
    if (!mindmapCode.includes('classDef')) {
      processedLines.push('\n%% Style definitions');
      processedLines.push('%% classDef rootStyle fill:#8B5CF6,stroke:#6E59A5,stroke-width:2px,color:white,font-weight:bold');
      processedLines.push('%% classDef mainTopic fill:#E5DEFF,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C');
      processedLines.push('%% classDef subTopic1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C');
      processedLines.push('%% classDef subTopic2 fill:#FDE1D3,stroke:#F97316,stroke-width:1px,color:#1A1F2C');
      processedLines.push('%% classDef subTopic3 fill:#F1F0FB,stroke:#D946EF,stroke-width:1px,color:#1A1F2C');
      processedLines.push('%% classDef detail fill:#F5F5F5,stroke:#6B7280,stroke-width:1px,color:#1A1F2C,font-style:italic');
    }

    return processedLines.join('\n');
  };
  
  // Generate a fallback mindmap structure if Gemini fails
  const generateFallbackMindmap = (pdfText: string | null): string => {
    // Try to extract some content from the PDF text for the fallback mindmap
    let paperTitle = "Paper Analysis";
    let sections = [
      "Introduction",
      "Methodology",
      "Results",
      "Discussion",
      "Conclusion"
    ];
    
    // Try to extract title from PDF text if available
    if (pdfText) {
      const firstLines = pdfText.split('\n').slice(0, 5).join(' ');
      const potentialTitle = firstLines.substring(0, 100).replace(/\s+/g, ' ').trim();
      if (potentialTitle) {
        paperTitle = potentialTitle;
      }
      
      // Look for section indicators in text
      const sectionMatches = pdfText.match(/\b(abstract|introduction|method|result|discussion|conclusion)\b/gi);
      if (sectionMatches && sectionMatches.length > 0) {
        const uniqueSections = Array.from(new Set(sectionMatches.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())));
        if (uniqueSections.length > 2) {
          sections = uniqueSections;
        }
      }
    }
    
    // Basic mindmap structure with emojis
    let mindmap = `mindmap
  root(("📑 ${paperTitle.substring(0, 50)}"))\n`;
    
    // Add main sections
    sections.forEach(section => {
      let emoji = '📄';
      if (section.toLowerCase().includes('introduction')) emoji = '🚪';
      if (section.toLowerCase().includes('method')) emoji = '⚙️';
      if (section.toLowerCase().includes('result')) emoji = '📊';
      if (section.toLowerCase().includes('discussion')) emoji = '💭';
      if (section.toLowerCase().includes('conclusion')) emoji = '🏁';
      if (section.toLowerCase().includes('abstract')) emoji = '🔍';
      
      mindmap += `  root --> section_${section.toLowerCase().replace(/\s/g, '_')}["${emoji} ${section}"]\n`;
      
      // Add some subsections based on common paper structure
      if (section.toLowerCase().includes('introduction')) {
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> intro_background("📘 Background")\n`;
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> intro_objective("🎯 Objective")\n`;
      } else if (section.toLowerCase().includes('method')) {
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> method_approach("🧪 Approach")\n`;
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> method_data("📊 Data")\n`;
      } else if (section.toLowerCase().includes('result')) {
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> results_main("✨ Key Findings")\n`;
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> results_analysis("📏 Analysis")\n`;
      } else if (section.toLowerCase().includes('discussion')) {
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> discussion_implications("💡 Implications")\n`;
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> discussion_limitations("🛑 Limitations")\n`;
      } else if (section.toLowerCase().includes('conclusion')) {
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> conclusion_summary("✅ Summary")\n`;
        mindmap += `    section_${section.toLowerCase().replace(/\s/g, '_')} --> conclusion_future("🔮 Future Work")\n`;
      }
    });
    
    // Add styling
    mindmap += `
  %% Style definitions
  %% classDef rootStyle fill:#8B5CF6,stroke:#6E59A5,stroke-width:2px,color:white,font-weight:bold
  %% classDef mainTopic fill:#E5DEFF,stroke:#8B5CF6,stroke-width:1px,color:#1A1F2C
  %% classDef subTopic1 fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1px,color:#1A1F2C
  %% classDef subTopic2 fill:#FDE1D3,stroke:#F97316,stroke-width:1px,color:#1A1F2C
  %% classDef subTopic3 fill:#F1F0FB,stroke:#D946EF,stroke-width:1px,color:#1A1F2C
  %% classDef detail fill:#F5F5F5,stroke:#6B7280,stroke-width:1px,color:#1A1F2C,font-style:italic`;
    
    return mindmap;
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
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-red-500" />
            Mermaid Mindmap from PDF
          </DialogTitle>
          <DialogDescription className="text-xs">
            AI-generated visualization of the paper structure as a mindmap with key points and relationships.
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
                    <p>Generating AI-enhanced mindmap from your document...</p>
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
