
import { useState, useCallback } from 'react';

export interface MindmapGeneratorReturn {
  code: string;
  error: string | null;
  isGenerating: boolean;
  generateMindmap: () => void;
}

// Default mindmap code
export const defaultMindmap = `mindmap
  root((Research Paper))
    Origins
      Big Bang
      "Abiogenesis"
    Evolution
      ::icon(fa fa-book)
      Dinosaurs
      Extinction
        ["Asteroid Impact"]
        ::icon(fa fa-globe)
    Concepts
      Mammals
        Primates
          Humans
`;

const useMindmapGenerator = (): MindmapGeneratorReturn => {
  const [code, setCode] = useState<string>(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateMindmap = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // For now, we'll just use the default mindmap
      // In a real implementation, this would generate a mindmap based on the PDF content
      const mockGeneratedMindmap = `mindmap
  root((Research Paper))
    Introduction
      Background
      Problem Statement
      Research Questions
    Methodology
      Data Collection
      Analysis Methods
    Results
      Key Findings
      Statistical Analysis
    Discussion
      Interpretation
      Comparison with Prior Work
      Limitations
    Conclusion
      Summary
      Future Work`;

      // Simulate a delay for API call
      setTimeout(() => {
        setCode(mockGeneratedMindmap);
        setIsGenerating(false);
      }, 1500);
    } catch (err) {
      setError(`Error generating mindmap: ${err instanceof Error ? err.message : String(err)}`);
      setIsGenerating(false);
    }
  }, []);

  return {
    code,
    error,
    isGenerating,
    generateMindmap
  };
};

export default useMindmapGenerator;
