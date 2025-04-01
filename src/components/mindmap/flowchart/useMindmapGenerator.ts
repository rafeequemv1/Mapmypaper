import { useState } from "react";
import { generateAiResponse } from "@/services/geminiService";

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

      const prompt = `
        Create a mindmap diagram using Mermaid syntax based on the following document text.
        Focus on the main concepts and their relationships.
        Use the mindmap syntax with a concise root node name that describes the document topic.
        Include 3-5 key concepts with 2-3 subconcepts each.
        Ensure the diagram is readable and compact.
        
        Document text:
        ${pdfText.substring(0, 3000)}
        
        Return ONLY the mermaid diagram code starting with "mindmap" and nothing else.
      `;

      const response = await generateAiResponse(prompt);
      
      if (response) {
        // Extract only the mindmap code from the response
        let diagramCode = response.trim();
        
        // Make sure the response starts with 'mindmap'
        if (!diagramCode.startsWith('mindmap')) {
          // Try to find the mindmap section in the response
          const mindmapMatch = diagramCode.match(/mindmap[\s\S]+/);
          if (mindmapMatch) {
            diagramCode = mindmapMatch[0];
          } else {
            throw new Error("Failed to generate a valid mindmap diagram.");
          }
        }
        
        setCode(diagramCode);
      } else {
        throw new Error("Failed to generate a response from the AI.");
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
