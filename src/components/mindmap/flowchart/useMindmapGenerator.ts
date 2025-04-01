
import { useState } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";
import { generateMindmapFromPdf } from "@/services/geminiService";

export const defaultMindmap = `mindmap
  root((Research Paper))
    Introduction
      Background
      Problem Statement
      Objectives
    Methodology
      Data Collection
      Analysis Techniques
    Results
      Key Findings
      Statistical Outcomes
    Discussion
      Interpretation
      Limitations
    Conclusion
      Summary
      Future Work`;

// Helper function to clean and validate Mermaid mindmap syntax
export const cleanMindmapSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Ensure it starts with mindmap directive
  if (!cleaned.startsWith("mindmap")) {
    cleaned = "mindmap\n" + cleaned;
  }
  
  // Process line by line for better formatting
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with mindmap
    if (!line.trim() || line.trim().startsWith('mindmap')) {
      return line;
    }
    
    // Remove special characters that might break the syntax
    let processedLine = line
      .replace(/[;]/g, "")
      .replace(/[<>]/g, "");
      
    return processedLine;
  });
  
  return processedLines.join('\n');
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
      const mindmapCode = await generateMindmapFromPdf();
      
      // Clean and validate the mermaid syntax
      const cleanedCode = cleanMindmapSyntax(mindmapCode);
      
      // Check if the mindmap code is valid
      try {
        await mermaid.parse(cleanedCode);
        setCode(cleanedCode);
        toast({
          title: "Mindmap Generated",
          description: "A mindmap has been created based on your PDF content.",
        });
      } catch (parseError) {
        console.error("Mermaid parse error:", parseError);
        setError(`Invalid mindmap syntax. Using default instead. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        setCode(defaultMindmap);
        toast({
          title: "Syntax Error",
          description: "The generated mindmap had syntax errors. Using a default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to generate mindmap:", err);
      setCode(defaultMindmap);
      setError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Generation Failed",
        description: "Failed to generate mindmap from PDF content.",
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
