
import { useState, useCallback } from 'react';
import { generateSequenceDiagramFromPdf } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';

export const useSequenceDiagramGenerator = () => {
  const { toast } = useToast();
  const [mermaidCode, setMermaidCode] = useState<string>('sequenceDiagram\n  Note over System: Upload PDF to Generate\n  System->>User: Waiting for input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSequenceDiagram = useCallback(async (pdfText: string) => {
    if (!pdfText) {
      setError("No PDF text provided");
      toast({
        title: "Error",
        description: "No PDF text provided",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Generating Sequence Diagram",
        description: "This may take a minute..."
      });

      // Get the sequence diagram code
      const result = await generateSequenceDiagramFromPdf(pdfText);
      setMermaidCode(result);
      
      toast({
        title: "Success",
        description: "Sequence diagram generated successfully!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate sequence diagram";
      
      console.error("Sequence diagram generation error:", err);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    mermaidCode,
    loading,
    error,
    generateSequenceDiagram
  };
};
