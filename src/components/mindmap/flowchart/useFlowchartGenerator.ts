
import { useState, useCallback } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/gemini";

export const defaultFlowchart = `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

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

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const resetGenerator = useCallback(() => {
    // Reset state to initial values - prevents memory leaks or stale data
    setCode(defaultFlowchart);
    setError(null);
    setIsGenerating(false);
  }, []);

  const generateFlowchart = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Use a safer approach with timeout protection
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Flowchart generation timed out after 30 seconds")), 30000);
      });
      
      // Use Promise.race with a shorter timeout to prevent UI freezing
      const generationPromise = generateFlowchartFromPdf()
        .catch(error => {
          console.error("Error in flowchart generation:", error);
          // Return default flowchart on error instead of throwing
          return defaultFlowchart;
        });
      
      // Use Promise.race to implement timeout
      const flowchartCode = await Promise.race([generationPromise, timeoutPromise]);
      
      // Avoid freezing the UI by moving the heavy processing to the next tick
      setTimeout(() => {
        try {
          // Clean and validate the mermaid syntax
          const cleanedCode = cleanMermaidSyntax(flowchartCode);
          
          // Check if the flowchart code is valid
          mermaid.parse(cleanedCode)
            .then(() => {
              setCode(cleanedCode);
              toast({
                title: "Flowchart Generated",
                description: "A flowchart has been created based on your PDF content.",
              });
            })
            .catch((parseError) => {
              console.error("Mermaid parse error:", parseError);
              setError(`Invalid flowchart syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
              setCode(defaultFlowchart);
              toast({
                title: "Syntax Error",
                description: "The generated flowchart had syntax errors. Using a default template instead.",
                variant: "destructive",
              });
            })
            .finally(() => {
              setIsGenerating(false);
            });
        } catch (err) {
          console.error("Failed to process flowchart:", err);
          setCode(defaultFlowchart);
          setError(`Processing failed: ${err instanceof Error ? err.message : String(err)}`);
          setIsGenerating(false);
          toast({
            title: "Processing Failed",
            description: "Failed to process flowchart code.",
            variant: "destructive",
          });
        }
      }, 0);
    } catch (err) {
      console.error("Failed to generate flowchart:", err);
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate flowchart from PDF content.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  }, []);

  return {
    code,
    error,
    isGenerating,
    generateFlowchart,
    handleCodeChange,
    resetGenerator
  };
};

export default useFlowchartGenerator;
