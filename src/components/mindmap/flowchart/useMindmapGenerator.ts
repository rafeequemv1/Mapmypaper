
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generateMindmapFromPdf } from '@/services/geminiService';

export interface MindmapGeneratorReturn {
  code: string;
  error: string | null;
  isGenerating: boolean;
  generateMindmap: () => void;
}

// Default mindmap code (only used as fallback if generation fails)
export const defaultMindmap = `mindmap
  root((Research Paper))
    Introduction
      Background
        "Research field overview"
        "Previous related studies"
      Problem Statement
        "Main issue being addressed"
        "Knowledge gap identification"
      Research Questions
        "Primary question"
        "Supporting questions"
    Methodology
      Data Collection
        "Survey design and distribution"
        "Interview protocol"
        "Sample selection criteria"
      Analysis Methods
        "Statistical approaches used"
        "Data coding procedures"
        "Analytical framework"
    Results
      Key Findings
        "Primary outcomes"
        "Statistical significance"
        "Patterns identified"
      Statistical Analysis
        "Correlation between variables"
        "Regression analysis outcomes"
        "Confidence intervals"
    Discussion
      Interpretation
        "Meaning of findings"
        "Theoretical implications"
      Comparison with Prior Work
        "Alignment with previous research"
        "New contributions"
      Limitations
        "Methodological constraints"
        "Sample limitations"
        "Potential biases"
    Conclusion
      Summary
        "Research question resolution"
        "Key takeaways"
      Future Work
        "New research directions"
        "Application potential"
`;

const useMindmapGenerator = (): MindmapGeneratorReturn => {
  const [code, setCode] = useState<string>(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();

  const generateMindmap = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call the Gemini API to generate a mindmap based on PDF content
      const mindmapCode = await generateMindmapFromPdf();
      
      if (mindmapCode && mindmapCode.trim()) {
        setCode(mindmapCode);
        toast({
          title: "Mindmap Generated",
          description: "A detailed mindmap has been created based on your PDF content.",
        });
      } else {
        // If we get an empty response, use default but show an error
        setCode(defaultMindmap);
        setError("Could not generate mindmap from PDF. Using default template.");
        toast({
          title: "Generation Issue",
          description: "Could not generate custom mindmap. Using default template instead.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error generating mindmap:", err);
      setError(`Error generating mindmap: ${err instanceof Error ? err.message : String(err)}`);
      setCode(defaultMindmap);
      toast({
        title: "Generation Failed",
        description: "Failed to generate mindmap from PDF content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return {
    code,
    error,
    isGenerating,
    generateMindmap
  };
};

export default useMindmapGenerator;
