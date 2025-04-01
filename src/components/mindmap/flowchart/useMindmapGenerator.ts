
import { useState, useCallback } from 'react';
import { generateMindmapFromPdf } from '@/services/geminiService';
import { useToast } from '@/hooks/use-toast';

// Define the node data structure
export interface MindMapNodeData {
  id: string;
  topic: string;
  children?: MindMapNodeData[];
}

export interface MindMapData {
  nodeData: MindMapNodeData;
}

export const useMindmapGenerator = () => {
  const { toast } = useToast();
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMindmap = useCallback(async (pdfText: string) => {
    if (!pdfText) {
      setError("No PDF text provided");
      toast({
        title: "Error",
        description: "No PDF text provided",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Generating Mind Map",
        description: "This may take a minute..."
      });

      // Get the mind map data
      const result = await generateMindmapFromPdf(pdfText);
      
      // Validate that the response has the expected structure
      if (!result || !result.nodeData) {
        throw new Error("Invalid mind map data returned");
      }
      
      setMindMapData(result);
      
      toast({
        title: "Success",
        description: "Mind map generated successfully!",
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate mind map";
      
      console.error("Mind map generation error:", err);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Function to regenerate the mindmap with the stored PDF text
  const regenerateMindmap = useCallback(async () => {
    const pdfText = sessionStorage.getItem('pdfText');
    if (!pdfText) {
      setError("No PDF text found in session storage");
      toast({
        title: "Error",
        description: "No PDF text found. Please upload a PDF first.",
        variant: "destructive",
      });
      return null;
    }
    
    return await generateMindmap(pdfText);
  }, [generateMindmap, toast]);
  
  return {
    mindMapData,
    loading,
    error,
    generateMindmap,
    regenerateMindmap
  };
};
