
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultSequenceDiagram = `sequenceDiagram
    participant Client
    participant Server
    participant Database
    
    Client->>Server: Request data
    Server->>Database: Query data
    Database-->>Server: Return data
    Server-->>Client: Response with data`;

export const useSequenceDiagramGenerator = () => {
  const [code, setCode] = useState(defaultSequenceDiagram);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDiagram = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const diagramCode = await generateFlowchartFromPdf('sequence');
      
      // Check if the sequence diagram code is valid
      try {
        await mermaid.parse(diagramCode);
        setCode(diagramCode);
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
