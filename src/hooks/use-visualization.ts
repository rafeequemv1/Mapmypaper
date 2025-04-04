
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateMermaidDiagram } from "@/services/geminiService";

export type VisualizationType = "mindmap" | "flowchart";

export function useVisualization() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("mindmap");
  const [mermaidSyntax, setMermaidSyntax] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSyntax, setSavedSyntax] = useState<Record<VisualizationType, string>>({
    mindmap: "",
    flowchart: ""
  });

  const openModal = async (type: VisualizationType) => {
    setVisualizationType(type);
    setIsModalOpen(true);
    
    // Check if we have PDF data available
    const pdfAvailable = sessionStorage.getItem('pdfAvailable') === 'true';
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfAvailable || !pdfText) {
      toast({
        title: "No PDF available",
        description: "Please upload a PDF first to generate a visualization.",
        variant: "destructive"
      });
      return;
    }
    
    // Always generate a visualization when opening the modal
    // This removes the need to click the regenerate button
    generateVisualization(type);
  };
  
  const generateVisualization = async (type: VisualizationType) => {
    try {
      setIsGenerating(true);
      const pdfText = sessionStorage.getItem('pdfText');
      
      if (!pdfText) {
        throw new Error("No PDF text found in session storage");
      }
      
      console.log(`Generating ${type} visualization...`);
      // Update prompt to request formatted responses with bullet points, headlines, and citations
      const syntax = await generateMermaidDiagram(type, pdfText);
      
      // Save the syntax for future use
      setSavedSyntax(prev => ({
        ...prev,
        [type]: syntax
      }));
      
      setMermaidSyntax(syntax);
      
      toast({
        title: "Visualization generated",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been created successfully.`
      });
    } catch (error) {
      console.error("Error generating visualization:", error);
      toast({
        title: "Error generating visualization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const updateSyntax = (newSyntax: string) => {
    setMermaidSyntax(newSyntax);
    // Also update saved syntax for this type
    setSavedSyntax(prev => ({
      ...prev,
      [visualizationType]: newSyntax
    }));
  };
  
  return {
    isModalOpen,
    visualizationType,
    mermaidSyntax,
    isGenerating,
    openModal,
    closeModal,
    updateSyntax,
    generateVisualization
  };
}
