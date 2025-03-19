
import { useState, useRef, useCallback } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateSequenceDiagramFromPdf } from "@/services/gemini";

export const defaultSequenceDiagram = `sequenceDiagram
    participant Researcher
    participant Experiment
    participant Data
    
    Researcher->>Experiment: Setup parameters
    Experiment->>Data: Generate results
    Data->>Researcher: Return analysis
    Note right of Researcher: Evaluate findings
    Researcher->>Researcher: Draw conclusions`;

// Helper function to clean and validate Mermaid syntax for sequence diagrams
export const cleanSequenceDiagramSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with sequenceDiagram directive
  if (!cleaned.startsWith("sequenceDiagram")) {
    cleaned = "sequenceDiagram\n" + cleaned;
  }
  
  return cleaned;
};

export const useSequenceDiagramGenerator = () => {
  const [code, setCode] = useState(defaultSequenceDiagram);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const generationAbortController = useRef<AbortController | null>(null);

  // Add cleanup resources function - now safer
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
    
    console.log("Sequence diagram generator resources cleaned up safely");
  }, []);

  const generateDiagram = async () => {
    try {
      // Clean up any previous generation attempt
      cleanupResources();
      
      // Create a new abort controller for this generation
      generationAbortController.current = new AbortController();
      
      setIsGenerating(true);
      setError(null);
      const diagramCode = await generateSequenceDiagramFromPdf();
      
      // Check if we've been aborted
      if (generationAbortController.current.signal.aborted) {
        console.log("Sequence diagram generation was aborted");
        return;
      }
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanSequenceDiagramSyntax(diagramCode);
      
      // Check if the diagram code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Sequence Diagram Generated",
          description: "A sequence diagram has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid sequence diagram syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(defaultSequenceDiagram);
        toast({
          title: "Syntax Error",
          description: "The generated sequence diagram had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      // Only show error if we haven't been aborted
      if (!generationAbortController.current?.signal.aborted) {
        console.error("Failed to generate sequence diagram:", err);
        setCode(defaultSequenceDiagram);
        setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
        toast({
          title: "Generation Failed",
          description: "Failed to generate sequence diagram from PDF content.",
          variant: "destructive",
        });
      }
    } finally {
      // Only update state if we haven't been aborted
      if (generationAbortController.current && !generationAbortController.current.signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  return {
    code,
    error,
    isGenerating,
    generateDiagram,
    handleCodeChange,
    cleanupResources
  };
};

export default useSequenceDiagramGenerator;
