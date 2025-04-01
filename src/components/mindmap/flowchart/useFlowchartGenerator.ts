
import { useState } from 'react';
import { generateFlowchartFromPdf } from '@/services/geminiService';
import { MindElixirData } from 'mind-elixir';

// Default flowchart template
export const defaultFlowchart = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

// Hook for flowchart generation
export function useFlowchartGenerator() {
  const [mermaidCode, setMermaidCode] = useState<string>(defaultFlowchart);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Generate flowchart from PDF text
  const generateFlowchart = async (pdfText: string) => {
    setLoading(true);
    setError('');
    
    try {
      if (!pdfText || pdfText.trim() === '') {
        throw new Error('No PDF text provided');
      }
      
      const flowchartCode = await generateFlowchartFromPdf(pdfText);
      setMermaidCode(flowchartCode);
      return flowchartCode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate flowchart';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle manual code changes
  const handleCodeChange = (newCode: string) => {
    setMermaidCode(newCode);
  };

  return {
    mermaidCode,
    loading,
    error,
    generateFlowchart,
    handleCodeChange
  };
}
