
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateSequenceDiagramFromPdf } from "@/services/geminiService";

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

  const generateDiagram = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const diagramCode = await generateSequenceDiagramFromPdf();
      
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
      console.error("Failed to generate sequence diagram:", err);
      setCode(defaultSequenceDiagram);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Generation Failed",
        description: "Failed to generate sequence diagram from PDF content.",
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
    generateDiagram,
    handleCodeChange
  };
};

export default useSequenceDiagramGenerator;
