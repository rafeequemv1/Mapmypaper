
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

// This is a fallback template, but we'll prioritize generating from PDF content
export const defaultFlowchart = `flowchart LR
    A[The uploaded document has not been processed yet] -->|Please wait| B[Our system is preparing to extract content from your PDF]
    B --> C[You will see a detailed flowchart based on your document content]`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Fix common syntax errors
  cleaned = cleaned
    // Fix arrows if needed
    .replace(/-+>/g, "-->")
    // Replace any hyphens in node IDs with underscores
    .replace(/(\w+)-(\w+)/g, "$1_$2");
  
  // Ensure it starts with flowchart LR directive (Left to Right layout)
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else {
    // Replace TD with LR directive
    cleaned = cleaned.replace(/flowchart\s+TD/i, "flowchart LR");
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with flowchart, subgraph, or end
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end') {
      return line;
    }
    
    // Handle node definitions with text containing hyphens
    // Replace hyphens inside node text brackets
    let processedLine = line;
    
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

// Add styling function to enhance node appearance with rounded corners
const enhanceFlowchartWithStyling = (flowchartCode: string): string => {
  // Add styling section at the end of the flowchart
  let enhancedCode = flowchartCode;
  
  // Add styling for different types of nodes if they don't already exist
  if (!enhancedCode.includes("classDef")) {
    enhancedCode += `\n
    %% Node styling with rounded corners
    classDef concept fill:#e6f3ff,stroke:#4a86e8,stroke-width:2px,rx:15px,ry:15px
    classDef process fill:#e6ffe6,stroke:#6aa84f,stroke-width:2px,rx:15px,ry:15px
    classDef highlight fill:#fff2cc,stroke:#f1c232,stroke-width:2px,rx:15px,ry:15px
    classDef main fill:#d9d2e9,stroke:#8e7cc3,stroke-width:2px,rx:15px,ry:15px
    
    %% Apply styling to nodes - we'll apply styling more dynamically now
    class A,B,C main`;
  }
  
  return enhancedCode;
};

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(enhanceFlowchartWithStyling(defaultFlowchart));
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
      
      // Add styling to make the flowchart more visually appealing
      const enhancedCode = enhanceFlowchartWithStyling(cleanedCode);
      
      // Check if the flowchart code is valid
      try {
        await mermaid.parse(enhancedCode);
        setCode(enhancedCode);
        toast({
          title: "Flowchart Generated",
          description: "A detailed flowchart has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(enhanceFlowchartWithStyling(defaultFlowchart));
        toast({
          title: "Syntax Error",
          description: "The generated flowchart had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to generate flowchart:", err);
      setCode(enhanceFlowchartWithStyling(defaultFlowchart));
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
