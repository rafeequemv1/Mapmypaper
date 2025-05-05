
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultFlowchart = `flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

// Helper function to clean flowchart syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with flowchart directive and LR direction
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else if (cleaned.startsWith("flowchart TD")) {
    cleaned = cleaned.replace("flowchart TD", "flowchart LR");
  }
  
  return cleaned;
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
      
      // Clean the flowchart syntax
      const cleanedCode = cleanMermaidSyntax(flowchartCode);
      
      setCode(cleanedCode);
      toast({
        title: "Flowchart Generated",
        description: "A flowchart has been created based on your PDF content.",
      });
    } catch (err: any) {
      console.error("Failed to generate flowchart:", err);
      setCode(defaultFlowchart);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate flowchart from PDF content. Using default template.",
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
