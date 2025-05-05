import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Default mindmap diagram structure
export const defaultMindmap = `mindmap
  root((Paper Topic))
  class root rootStyle
  
  root --> summary["Summary"]
  class summary summaryClass
  
  summary --> keyPoints["Key Points"]
  class keyPoints summaryDetailClass
  
  summary --> mainContrib["Main Contributions"]
  class mainContrib summaryDetailClass
  
  summary --> significance["Significance"]
  class significance summaryDetailClass
  
  root --> concept1["Key Concept 1"]
  class concept1 branch1Class`;

/**
 * Custom hook for generating and managing mindmap diagrams
 */
const useMindmapGenerator = () => {
  const [code, setCode] = useState<string>(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  /**
   * Generate a mindmap based on the PDF content in session storage
   */
  const generateMindmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get PDF text from session storage
      const pdfText = sessionStorage.getItem("pdfText");
      
      if (!pdfText) {
        throw new Error("No PDF content found. Please upload a PDF document first.");
      }

      const response = await generateMindmapFromPdf();
      
      if (response) {
        // Process and enhance the response
        const enhancedResponse = processMindmapStructure(response);
        setCode(enhancedResponse);
      } else {
        throw new Error("Failed to generate a valid mindmap diagram.");
      }
    } catch (err) {
      console.error("Error generating mindmap:", err);
      setError(err instanceof Error ? err.message : "Unknown error generating mindmap");
      // Keep the default mindmap so there's something to display
      if (code !== defaultMindmap) {
        setCode(defaultMindmap);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Process and enhance mindmap structure
   */
  const processMindmapStructure = (mindmapCode: string): string => {
    // For now, just make sure the structure starts with mindmap
    if (!mindmapCode.trim().startsWith("mindmap")) {
      mindmapCode = "mindmap\n" + mindmapCode;
    }
    return mindmapCode;
  };

  /**
   * Handle changes to the mindmap code in the editor
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setError(null);
  };

  return {
    code,
    error,
    isGenerating,
    generateMindmap,
    handleCodeChange,
  };
};

export default useMindmapGenerator;
