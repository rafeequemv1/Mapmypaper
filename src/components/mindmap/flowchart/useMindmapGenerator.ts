import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Default mindmap diagram
export const defaultMindmap = `mindmap
  root((Paper Topic))
    Key Concept 1
      Sub-concept 1.1
      Sub-concept 1.2
    Key Concept 2
      Sub-concept 2.1
      Sub-concept 2.2
    Key Concept 3
      Sub-concept 3.1
        Detail 3.1.1
        Detail 3.1.2
`;

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
        setCode(response);
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
