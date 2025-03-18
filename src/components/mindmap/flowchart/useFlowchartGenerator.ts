
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
  
  // Fix common syntax errors
  cleaned = cleaned
    // Fix arrows if needed
    .replace(/-+>/g, "-->")
    // Replace any hyphens in node IDs with underscores
    .replace(/(\w+)-(\w+)/g, "$1_$2")
    // Replace year ranges with underscores
    .replace(/(\d{4})-(\d{4})/g, "$1_$2");
  
  // Ensure it starts with flowchart directive
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart TD\n" + cleaned;
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
