
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateFlowchartFromPdf } from "@/services/geminiService";

export const defaultMindmap = `mindmap
  root((My Mind Map))
    Topic 1
      Subtopic 1.1
      Subtopic 1.2
    Topic 2
      Subtopic 2.1
      Subtopic 2.2
        Details 2.2.1
        Details 2.2.2
    Topic 3
      Subtopic 3.1`;

// Helper function to clean and validate Mindmap syntax
export const cleanMindmapSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with mindmap directive
  if (!cleaned.startsWith("mindmap")) {
    cleaned = "mindmap\n" + cleaned;
  }
  
  return cleaned;
};

export const useMindmapGenerator = () => {
  const [code, setCode] = useState(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateMindmap = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Use the same service as flowcharts but prompt for mindmap format
      const mindmapCode = await generateFlowchartFromPdf('mindmap');
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMindmapSyntax(mindmapCode);
      
      // Check if the mindmap code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Mind Map Generated",
          description: "A mind map has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid mindmap syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(defaultMindmap);
        toast({
          title: "Syntax Error",
          description: "The generated mind map had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to generate mind map:", err);
      setCode(defaultMindmap);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Generation Failed",
        description: "Failed to generate mind map from PDF content.",
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
    generateMindmap,
    handleCodeChange
  };
};

export default useMindmapGenerator;
