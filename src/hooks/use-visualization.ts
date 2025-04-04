
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
    
    // Check if we already have saved syntax for this type
    if (savedSyntax[type]) {
      // Use the saved syntax
      setMermaidSyntax(savedSyntax[type]);
    } else {
      // Generate new visualization
      generateVisualization(type);
    }
  };
  
  const generateVisualization = async (type: VisualizationType) => {
    try {
      setIsGenerating(true);
      const pdfText = sessionStorage.getItem('pdfText');
      
      if (!pdfText) {
        throw new Error("No PDF text found in session storage");
      }
      
      console.log(`Generating ${type} visualization...`);
      const syntax = await generateMermaidDiagram(type, pdfText);
      
      // Validate the syntax to ensure it starts with the right keyword
      let validatedSyntax = syntax;
      
      if (type === "flowchart" && !syntax.trim().startsWith("flowchart")) {
        // Missing the flowchart keyword, add it with TD (top-down) direction
        validatedSyntax = `flowchart TD\n${syntax}`;
        console.log("Added missing flowchart keyword");
      } else if (type === "mindmap" && !syntax.trim().startsWith("mindmap")) {
        // Missing the mindmap keyword, add it
        validatedSyntax = `mindmap\n${syntax}`;
        console.log("Added missing mindmap keyword");
      }
      
      // Fix common issues with flowchart syntax
      if (type === "flowchart") {
        // Replace lowercase "end" with "End" to avoid syntax errors
        validatedSyntax = validatedSyntax.replace(/\[(end)\]/gi, (match, p1) => {
          if (p1 === 'end') return '[End]';
          return match;
        });
        
        // Fix semicolons that shouldn't be there
        validatedSyntax = validatedSyntax.replace(/;(\s*$|\s*\n)/g, '$1');
        
        // Fix common syntax errors with parentheses and special characters
        validatedSyntax = validatedSyntax.replace(/\(([^)]*[&%])[^)]*\)/g, (match) => {
          // Escape the problematic characters by replacing them
          return match.replace(/[&]/g, 'and').replace(/[%]/g, 'pct');
        });
        
        // Remove lines that might cause parsing errors (lines with just punctuation or incomplete nodes)
        const lines = validatedSyntax.split('\n');
        validatedSyntax = lines
          .filter(line => !line.match(/^[\s\-_;:,\\\/]*$/)) // Remove lines with just punctuation
          .join('\n');
        
        // Make sure node connections use proper syntax
        validatedSyntax = validatedSyntax.replace(/-{2,}>/g, '-->');
        validatedSyntax = validatedSyntax.replace(/<-{2,}/g, '<--');
        
        // Fix any spaces at the beginning of lines
        validatedSyntax = validatedSyntax.replace(/^\s+/gm, '');
        
        // Make sure nodes are defined before they're used in connections
        // Extract all node definitions and connections
        const nodeDefinitions = new Set<string>();
        const connections: string[] = [];
        
        validatedSyntax.split('\n').forEach(line => {
          const definitionMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*(\[|\(|\{)/);
          if (definitionMatch) {
            nodeDefinitions.add(definitionMatch[1]);
          }
          
          const connectionMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*-->/);
          if (connectionMatch) {
            connections.push(line);
          }
        });
        
        console.log("Applied flowchart syntax fixes");
      }
      
      // Save the syntax for future use
      setSavedSyntax(prev => ({
        ...prev,
        [type]: validatedSyntax
      }));
      
      setMermaidSyntax(validatedSyntax);
      
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
