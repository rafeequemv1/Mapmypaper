import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultFlowchart = `flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    
    class A,C,D default
    class B decision`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with flowchart directive and LR direction
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else if (cleaned.startsWith("flowchart TD")) {
    // Convert TD to LR for left-to-right layout
    cleaned = cleaned.replace("flowchart TD", "flowchart LR");
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with flowchart, subgraph, or end
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end' ||
        line.trim().startsWith('class')) {
      return line;
    }
    
    // Fix arrows if needed
    let processedLine = line.replace(/-+>/g, "-->");
    
    // Replace any hyphens in node IDs with underscores
    processedLine = processedLine.replace(/(\b\w+)-(\w+\b)(?!\]|\)|\})/g, "$1_$2");
    
    // Handle date ranges by replacing hyphens with underscores
    processedLine = processedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
    processedLine = processedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
    processedLine = processedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
    
    // Replace problematic hyphens in node text with spaces
    // Handle multiple iterations to catch all hyphens
    for (let i = 0; i < 3; i++) {
      // Square brackets []
      processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Parentheses ()
      processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Curly braces {}
      processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
    }
    
    return processedLine;
  });
  
  // Add color classes if they don't exist
  let result = processedLines.join('\n');
  
  if (!result.includes('classDef')) {
    result += `
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px
    classDef danger fill:#FFDEE2,stroke:#EF4444,stroke-width:2px
    classDef info fill:#D3E4FD,stroke:#3B82F6,stroke-width:2px
    classDef neutral fill:#FDE1D3,stroke:#F97316,stroke-width:2px`;
  }
  
  return result;
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
          title: "Flowchart Generated",
          description: "A flowchart has been created based on your PDF content.",
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
    } catch (err: any) {
      console.error("Failed to generate flowchart:", err);

      let errorDesc = "Failed to generate flowchart from PDF content.";
      if (typeof err?.message === "string" && err.message?.includes("quota")) {
        errorDesc = "Failed to generate flowchart from Gemini. Quota exceeded or API unavailable. Using default template.";
      }
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Generation Failed",
        description: errorDesc,
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
