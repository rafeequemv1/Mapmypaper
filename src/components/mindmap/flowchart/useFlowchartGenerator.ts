import { useState, useCallback, useRef } from "react";
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
  
  try {
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
      
      return processedLine;
    });
    
    return processedLines.join('\n');
  } catch (error) {
    console.error("Error in cleanMermaidSyntax:", error);
    return cleaned; // Return the original cleaned string if any error occurs
  }
};

export const useFlowchartGenerator = () => {
  const [code, setCode] = useState(defaultFlowchart);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const generationAbortController = useRef<AbortController | null>(null);
  const mermaidInitialized = useRef(false);

  // Cleanup function to abort any pending operations
  const cleanupResources = useCallback(() => {
    // Cancel any pending API requests
    if (generationAbortController.current) {
      try {
        generationAbortController.current.abort();
      } catch (err) {
        console.error("Error aborting generation:", err);
      }
      generationAbortController.current = null;
    }
    
    // Reset state if needed
    setIsGenerating(false);
    
    // Clear any errors
    setError(null);
    
    console.log("Flowchart generator resources cleaned up safely");
  }, []);

  const initializeMermaid = useCallback(() => {
    try {
      if (!mermaidInitialized.current) {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          logLevel: "error",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });
        mermaidInitialized.current = true;
      }
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, []);

  const generateFlowchart = useCallback(async () => {
    try {
      // Clean up any previous generation attempt
      cleanupResources();
      
      // Create a new abort controller for this generation
      generationAbortController.current = new AbortController();
      
      setIsGenerating(true);
      setError(null);
      
      const flowchartCode = await generateFlowchartFromPdf();
      
      // Check if we've been aborted
      if (generationAbortController.current.signal.aborted) {
        console.log("Flowchart generation was aborted");
        return;
      }
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      // Initialize mermaid before parsing
      initializeMermaid();
      
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
    } catch (err) {
      // Only show error if we haven't been aborted
      if (!generationAbortController.current?.signal.aborted) {
        console.error("Failed to generate flowchart:", err);
        setCode(defaultFlowchart);
        setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
        toast({
          title: "Generation Failed",
          description: "Failed to generate flowchart from PDF content.",
          variant: "destructive",
        });
      }
    } finally {
      // Only update state if we haven't been aborted
      if (generationAbortController.current && !generationAbortController.current.signal.aborted) {
        setIsGenerating(false);
      }
    }
  }, [toast, cleanupResources, initializeMermaid]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    // Clear errors when user edits the code
    if (error) {
      setError(null);
    }
  }, [error]);

  return {
    code,
    error,
    isGenerating,
    generateFlowchart,
    handleCodeChange,
    cleanupResources
  };
};

export default useFlowchartGenerator;
