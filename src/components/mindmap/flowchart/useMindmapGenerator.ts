
import { useState, useCallback } from 'react';
import mermaid from 'mermaid';

// Define TypeScript types for the hook return values
export interface MindmapGeneratorReturn {
  code: string;
  isGenerating: boolean;
  error: string | null;
  generateMindmap: () => Promise<void>;
  updateCode: (newCode: string) => void;
}

// Custom hook for generating mindmaps with Mermaid
export const useMindmapGenerator = (): MindmapGeneratorReturn => {
  const [code, setCode] = useState<string>(`mindmap
  root((Paper Topic))
    Introduction
      Background
      Research Question
    Methods
      Data Collection
      Analysis
    Results
      Finding 1
      Finding 2
    Discussion
      Implications
      Limitations
    Conclusion`);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update the code directly
  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  // Function to generate the mindmap from PDF content
  const generateMindmap = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get the PDF text from session storage
      const pdfText = sessionStorage.getItem('pdfText');
      
      if (!pdfText) {
        throw new Error('No PDF text found. Please upload a PDF first.');
      }
      
      // Simple mindmap template based on the PDF content
      // In a real implementation, this would be generated from the PDF content
      const mindmapTemplate = `mindmap
  root((Research Paper))
    Introduction
      Background
      Problem Statement
    Methodology
      Data Collection
      Analysis Approach
    Results
      Key Findings
      Statistical Data
    Discussion
      Implications
      Limitations
    Conclusion
      Summary
      Future Work`;
      
      setCode(mindmapTemplate);
    } catch (err) {
      console.error('Error generating mindmap:', err);
      setError(`Failed to generate mindmap: ${err instanceof Error ? err.message : String(err)}`);
      
      // Set a fallback mindmap on error
      setCode(`mindmap
  root((Error))
    Failed to generate mindmap
      Please try again`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    code,
    isGenerating,
    error,
    generateMindmap,
    updateCode
  };
};

export default useMindmapGenerator;
