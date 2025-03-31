
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultFlowchart = `flowchart TD
    A([Research Paper]) --> B([Introduction])
    A --> C([Methodology])
    A --> D([Results])
    A --> E([Discussion])
    A --> F([Conclusion])
    
    B --> B1([Background])
    B --> B2([Research Gap])
    B --> B3([Objectives])
    
    C --> C1([Study Design])
    C --> C2([Data Collection])
    C --> C3([Analysis Methods])
    
    D --> D1([Key Findings])
    D --> D2([Statistical Insights])
    D --> D3([Visual Representations])
    
    E --> E1([Interpretation])
    E --> E2([Limitations])
    E --> E3([Implications])
    
    F --> F1([Summary])
    F --> F2([Future Research])
    
    style A fill:#f9f7ff,stroke:#8B5CF6,stroke-width:2px,color:#333,rx:15,ry:15
    style B fill:#e6f7ff,stroke:#0EA5E9,stroke-width:2px,color:#333,rx:15,ry:15
    style C fill:#f2fcf5,stroke:#10B981,stroke-width:2px,color:#333,rx:15,ry:15
    style D fill:#fff7ed,stroke:#F97316,stroke-width:2px,color:#333,rx:15,ry:15
    style E fill:#fdf4ff,stroke:#D946EF,stroke-width:2px,color:#333,rx:15,ry:15
    style F fill:#f5f3ff,stroke:#8B5CF6,stroke-width:2px,color:#333,rx:15,ry:15`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Fix common syntax errors
  cleaned = cleaned
    // Fix arrows if needed
    .replace(/-+>/g, "-->")
    // Replace any hyphens in node IDs with underscores
    .replace(/(\w+)-(\w+)/g, "$1_$2");
  
  // Ensure it starts with flowchart directive
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart TD\n" + cleaned;
  }

  // Add style definitions for rounded corners and soft colors if missing
  if (!cleaned.includes("style ")) {
    // Extract node IDs from the flowchart code
    const nodeIdRegex = /\b([A-Za-z0-9_]+)\b(?=\s*(?:\([^\)]+\)|\[[^\]]+\]|\{[^\}]+\}))/g;
    const nodeIds = Array.from(new Set(cleaned.match(nodeIdRegex) || []));
    
    // Color palette for nodes (soft, pastel colors)
    const colors = [
      { fill: '#f9f7ff', stroke: '#8B5CF6' }, // Purple
      { fill: '#e6f7ff', stroke: '#0EA5E9' }, // Blue
      { fill: '#f2fcf5', stroke: '#10B981' }, // Green
      { fill: '#fff7ed', stroke: '#F97316' }, // Orange
      { fill: '#fdf4ff', stroke: '#D946EF' }, // Pink
      { fill: '#f5f3ff', stroke: '#8B5CF6' }, // Light Purple
      { fill: '#ecfdf5', stroke: '#059669' }, // Emerald
      { fill: '#f0f9ff', stroke: '#3B82F6' }, // Light Blue
      { fill: '#fef3c7', stroke: '#F59E0B' }, // Amber
      { fill: '#ffe4e6', stroke: '#EF4444' }  // Red
    ];
    
    // Add styles for each node with rounded corners and soft colors
    let styleDefinitions = '';
    nodeIds.forEach((nodeId, index) => {
      const colorIndex = index % colors.length;
      styleDefinitions += `\nstyle ${nodeId} fill:${colors[colorIndex].fill},stroke:${colors[colorIndex].stroke},stroke-width:2px,color:#333,rx:15,ry:15`;
    });
    
    cleaned += styleDefinitions;
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with flowchart, subgraph, or end
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end' ||
        line.trim().startsWith('style ')) {
      return line;
    }
    
    // Handle node definitions with text containing hyphens
    // Replace hyphens inside node text brackets
    let processedLine = line;
    
    // Process node shapes - convert all basic nodes to rounded rectangles if not already shaped
    if (processedLine.includes('-->') && !processedLine.includes('(') && !processedLine.includes('[') && !processedLine.includes('{')) {
      // Find node IDs and wrap them in rounded rectangles ([...])
      processedLine = processedLine.replace(/(\b[A-Za-z0-9_]+\b)(\s*-->)/g, '($1)$2');
      processedLine = processedLine.replace(/(-->\s*)(\b[A-Za-z0-9_]+\b)(\b|$)/g, '$1($2)');
    }
    
    // Handle square brackets []
    processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
      return '[' + p1 + ' ' + p2 + ']';
    });
    
    // Handle parentheses ()
    processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
      return '(' + p1 + ' ' + p2 + ')';
    });
    
    // Handle curly braces {}
    processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
      return '{' + p1 + ' ' + p2 + '}';
    });
    
    // Replace all remaining dashes in node text with spaces or underscores
    // This needs to run multiple times to catch all hyphens in text
    for (let i = 0; i < 3; i++) {
      // Handle square brackets []
      processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle parentheses ()
      processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle curly braces {}
      processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
    }
    
    return processedLine;
  });
  
  return processedLines.join('\n');
};

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFlowchart = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const flowchartCode = await generateFlowchartFromPdf();
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      // Check if the flowchart code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Research Paper Analysis Complete",
          description: "A detailed flowchart of your research paper has been created.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(defaultFlowchart);
        toast({
          title: "Syntax Error",
          description: "The generated flowchart had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to generate flowchart:", err);
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Generation Failed",
        description: "Failed to generate flowchart from PDF content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  return {
    code,
    error,
    isGenerating,
    generateFlowchart,
    handleCodeChange
  };
};

export default useFlowchartGenerator;
