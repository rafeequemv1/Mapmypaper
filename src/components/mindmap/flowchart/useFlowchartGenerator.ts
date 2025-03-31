
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultFlowchart = `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  console.log("Cleaning Mermaid syntax, input length:", cleaned.length);
  
  // Guard against empty or invalid input
  if (!cleaned || cleaned.length < 10) {
    console.warn("Empty or too short Mermaid input");
    return defaultFlowchart;
  }
  
  // Fix common syntax errors
  cleaned = cleaned
    // Fix arrows if needed
    .replace(/-+>/g, "-->")
    // Replace any hyphens in node IDs with underscores
    .replace(/(\w+)-(\w+)/g, "$1_$2");
  
  // Ensure it starts with flowchart directive
  if (!cleaned.startsWith("flowchart")) {
    console.log("Adding missing flowchart directive");
    cleaned = "flowchart TD\n" + cleaned;
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
    
    // Fix node IDs in connections to use underscores instead of hyphens
    processedLine = processedLine.replace(/\b([A-Za-z0-9]+)-([A-Za-z0-9]+)\b(?!\]|\)|\})/g, "$1_$2");
    
    // Fix arrow syntax to ensure proper spacing
    processedLine = processedLine.replace(/(\w+)\s*-->\s*(\w+)/g, "$1 --> $2");
    
    // Fix arrow labels
    processedLine = processedLine.replace(/-->(\w)/g, "-->|$1");
    
    return processedLine;
  });
  
  const result = processedLines.join('\n');
  console.log("Mermaid syntax cleaning complete, output length:", result.length);
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
      
      // Get PDF text from sessionStorage
      const pdfText = sessionStorage.getItem('pdfText');
      if (!pdfText) {
        throw new Error("No PDF text found. Please upload a PDF first.");
      }
      
      console.log("Generating flowchart from PDF text, length:", pdfText.length);
      
      const flowchartCode = await generateFlowchartFromPdf();
      console.log("Raw flowchart code generated:", flowchartCode.substring(0, 500) + "...");
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      console.log("Cleaned flowchart code:", cleanedCode.substring(0, 500) + "...");
      
      // Check if the flowchart code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        console.log("Flowchart code successfully parsed by mermaid");
        toast({
          title: "Flowchart Generated",
          description: "A flowchart has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        
        // Try additional fallback cleaning for very problematic syntax
        try {
          console.log("Attempting further syntax cleaning");
          const simplifiedCode = `flowchart TD\n` + cleanedCode
            .split('\n')
            .filter(line => line.includes('-->')) // Only keep lines with connections
            .slice(0, 15) // Limit to a reasonable number of lines
            .join('\n');
          
          await mermaid.parse(simplifiedCode);
          setCode(simplifiedCode);
          console.log("Simplified flowchart parsed successfully");
          toast({
            title: "Simplified Flowchart Generated", 
            description: "A simplified flowchart was created due to complexity in the PDF content.",
          });
        } catch (fallbackError) {
          // If all else fails, use the default flowchart
          setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          setCode(defaultFlowchart);
          toast({
            title: "Syntax Error",
            description: "The generated flowchart had syntax errors. Using a default template instead.",
            variant: "destructive",
          });
        }
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
