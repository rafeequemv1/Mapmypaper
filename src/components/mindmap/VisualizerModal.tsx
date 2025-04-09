
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { retrievePDF } from "@/utils/pdfStorage";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVisualizerModal } from "@/hooks/use-visualizer-modal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Initialize mermaid with a custom theme
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    curve: 'basis',
    diagramPadding: 8,
  },
  themeVariables: {
    primaryColor: "#F2FCE2",        // Soft Green
    primaryTextColor: "#555555",    // Dark gray for text
    primaryBorderColor: "#D3E4FD",  // Soft Blue
    lineColor: "#9DB5B2",           // Muted teal
    secondaryColor: "#FEF7CD",      // Soft Yellow
    tertiaryColor: "#FFDEE2",       // Soft Pink
    fontSize: "16px"
  }
});

const VisualizerModal = () => {
  const { isVisualizerModalOpen, closeVisualizerModal } = useVisualizerModal();
  const [isLoading, setIsLoading] = useState(false);
  const [diagramId] = useState(`diagram-${Math.random().toString(36).substring(2, 11)}`);
  const [diagramDefinition, setDiagramDefinition] = useState("");
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate and render the flowchart when modal opens
  useEffect(() => {
    if (isVisualizerModalOpen) {
      generateFlowchart();
    } else {
      // Reset state when modal closes
      setDiagramDefinition("");
      setIsLoading(false);
    }
  }, [isVisualizerModalOpen]);

  // Render the flowchart when definition changes
  useEffect(() => {
    if (diagramDefinition && containerRef.current) {
      try {
        mermaid.render(diagramId, diagramDefinition)
          .then(({ svg }) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;
              
              // Add custom styling to the SVG
              const svgElement = containerRef.current.querySelector('svg');
              if (svgElement) {
                svgElement.style.maxWidth = '100%';
                svgElement.style.borderRadius = '8px';
                svgElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              }
            }
          })
          .catch(error => {
            console.error("Error rendering diagram:", error);
            toast({
              title: "Visualization Error",
              description: "Failed to generate the flowchart. Please try again.",
              variant: "destructive",
            });
          });
      } catch (error) {
        console.error("Error rendering diagram:", error);
        toast({
          title: "Visualization Error",
          description: "Failed to generate the flowchart. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [diagramDefinition, diagramId, toast]);

  const generateFlowchart = async () => {
    setIsLoading(true);
    try {
      // Get PDF text content
      const pdfData = await retrievePDF();
      
      if (!pdfData) {
        toast({
          title: "No PDF Data",
          description: "Please upload a PDF document first",
          variant: "destructive",
        });
        closeVisualizerModal();
        setIsLoading(false);
        return;
      }
      
      // Extract sections, keywords, and structure from the PDF
      const { sections, keywords, relationships } = extractDocumentStructure(pdfData);
      
      // Generate enhanced flowchart with extracted data
      const definition = generateEnhancedFlowchart(sections, keywords, relationships);
      setDiagramDefinition(definition);
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Visualization Error",
        description: "Failed to generate the flowchart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Extract document structure with more detailed analysis
  const extractDocumentStructure = (pdfText: string) => {
    // Extract sections with advanced pattern recognition
    const sections = extractSections(pdfText);
    
    // Extract keywords with frequency analysis
    const keywords = extractKeywords(pdfText);
    
    // Identify relationships between sections and keywords
    const relationships = identifyRelationships(sections, keywords, pdfText);
    
    return { sections, keywords, relationships };
  };

  // Enhanced flowchart generation with colorful nodes and relationships
  const generateEnhancedFlowchart = (
    sections: Array<{title: string, content: string}>, 
    keywords: string[], 
    relationships: Array<{from: string, to: string, type: string}>
  ) => {
    // Color palette for section nodes
    const sectionColors = [
      "F2FCE2", // Soft Green
      "FEF7CD", // Soft Yellow
      "FEC6A1", // Soft Orange
      "E5DEFF", // Soft Purple
      "FFDEE2", // Soft Pink
      "FDE1D3", // Soft Peach
      "D3E4FD", // Soft Blue
      "F1F0FB"  // Soft Gray
    ];
    
    let flowchart = `flowchart TD\n`;
    flowchart += `    classDef default fill:#F2FCE2,stroke:#9DB5B2,stroke-width:1px,color:#555555,font-size:14px\n`;
    
    // Create classes for each color
    sectionColors.forEach((color, index) => {
      flowchart += `    classDef color${index} fill:#${color},stroke:#9DB5B2,stroke-width:1px,color:#555555,font-size:14px\n`;
    });
    
    // Add title and main node
    flowchart += `    title([Research Paper Analysis]):::color7\n`;
    flowchart += `    title --> main[Main Content]\n`;
    
    // Add nodes for each section with different colors
    sections.forEach((section, index) => {
      const nodeId = `section${index}`;
      const colorClass = `color${index % sectionColors.length}`;
      const sectionTitle = section.title.substring(0, 50) + (section.title.length > 50 ? "..." : "");
      flowchart += `    main --> ${nodeId}["${sectionTitle}"]:::${colorClass}\n`;
      
      // Add subsections if content is available
      if (section.content) {
        const contentSummary = summarizeContent(section.content);
        if (contentSummary) {
          flowchart += `    ${nodeId} --> ${nodeId}_content["${contentSummary}"]:::${colorClass}\n`;
        }
      }
    });
    
    // Add connections based on relationships
    relationships.forEach((rel, index) => {
      const fromNode = `section${sections.findIndex(s => s.title.includes(rel.from))}`;
      const toNode = `section${sections.findIndex(s => s.title.includes(rel.to))}`;
      
      // Only add valid relationships where both nodes exist
      if (fromNode !== 'section-1' && toNode !== 'section-1') {
        flowchart += `    ${fromNode} -.-> |${rel.type}| ${toNode}\n`;
      }
    });
    
    // Add key findings node with keywords
    if (keywords.length > 0) {
      flowchart += `    main --> keywords[Key Terms]:::color4\n`;
      keywords.slice(0, 5).forEach((keyword, index) => {
        flowchart += `    keywords --> kw${index}["${keyword}"]:::color${(index + 4) % sectionColors.length}\n`;
      });
    }
    
    return flowchart;
  };

  // Helper function to extract sections from PDF text
  const extractSections = (pdfText: string) => {
    const sections: Array<{title: string, content: string}> = [];
    const lines = pdfText.split('\n');
    
    // Common section patterns in research papers
    const sectionPatterns = [
      /^(?:INTRODUCTION|Introduction)/i,
      /^(?:ABSTRACT|Abstract)/i,
      /^(?:METHODOLOGY|Methodology|METHODS|Methods)/i,
      /^(?:RESULTS|Results)/i,
      /^(?:DISCUSSION|Discussion)/i,
      /^(?:CONCLUSION|Conclusion)/i,
      /^(?:REFERENCES|References)/i,
      /^(?:LITERATURE REVIEW|Literature Review)/i,
      /^(?:BACKGROUND|Background)/i,
      /^(?:MATERIALS|Materials|MATERIALS AND METHODS)/i,
      /^(?:ANALYSIS|Analysis)/i,
      /^(?:FINDINGS|Findings)/i,
      /^(?:FUTURE WORK|Future Work)/i
    ];
    
    // Look for potential section headers
    let currentSection = "";
    let currentContent = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this line looks like a section header
      const isSectionHeader = 
        (line.length < 100 && line.length > 3) &&
        (line.toUpperCase() === line || 
         sectionPatterns.some(pattern => pattern.test(line)) ||
         /^\d+\.?\s+[A-Z]/.test(line));
      
      if (isSectionHeader) {
        // Save previous section before starting a new one
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent
          });
        }
        
        // Start a new section
        currentSection = line;
        currentContent = "";
      } else if (currentSection) {
        // Add line to current section content
        currentContent += line + " ";
      }
    }
    
    // Add the final section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent
      });
    }
    
    // If no sections found, create some generic ones based on content analysis
    if (sections.length < 3) {
      // Try to extract a title
      let title = extractTitle(pdfText);
      
      // Create generic sections
      sections.push({ title: "Introduction", content: extractIntroduction(pdfText) });
      sections.push({ title: "Main Content", content: pdfText.substring(Math.floor(pdfText.length * 0.25), Math.floor(pdfText.length * 0.75)) });
      sections.push({ title: "Conclusion", content: extractConclusion(pdfText) });
    }
    
    return sections;
  };

  // Helper functions for document analysis
  const extractTitle = (pdfText: string) => {
    const lines = pdfText.split('\n');
    // Usually the title is among the first few non-empty lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].trim().length > 15 && !/^abstract|introduction|contents/i.test(lines[i])) {
        return lines[i].trim();
      }
    }
    return "Research Paper";
  };

  const extractIntroduction = (pdfText: string) => {
    // Simple extraction - get the first 15% of the document
    return pdfText.substring(0, Math.floor(pdfText.length * 0.15));
  };

  const extractConclusion = (pdfText: string) => {
    // Simple extraction - get the last 15% of the document
    return pdfText.substring(Math.floor(pdfText.length * 0.85));
  };

  const summarizeContent = (content: string) => {
    // Create a brief summary (first 50 chars)
    if (!content || content.length < 10) return "";
    return content.substring(0, 50).trim() + "...";
  };

  const extractKeywords = (pdfText: string) => {
    // Simple keyword extraction - look for capitalized terms and frequent words
    const words = pdfText.split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    // Count word frequencies
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned && cleaned.length > 3) {
        wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
      }
    });
    
    // Find potential keywords (frequent words that start with a capital letter)
    const potentialKeywords = Object.keys(wordCount)
      .filter(word => 
        word.length > 3 && 
        wordCount[word] > 5 && 
        /^[A-Z]/.test(word) &&
        !/^(The|This|That|These|Those|Their|There|When|Where|Which|What|How|Why|And|But|For|With|About|From)$/.test(word)
      )
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 10);
    
    // If we don't have enough keywords, add some frequent words regardless of case
    if (potentialKeywords.length < 5) {
      const frequentWords = Object.keys(wordCount)
        .filter(word => word.length > 5 && wordCount[word] > 10)
        .sort((a, b) => wordCount[b] - wordCount[a])
        .slice(0, 10 - potentialKeywords.length);
      
      potentialKeywords.push(...frequentWords);
    }
    
    return [...new Set(potentialKeywords)].slice(0, 10);
  };

  const identifyRelationships = (
    sections: Array<{title: string, content: string}>, 
    keywords: string[], 
    pdfText: string
  ) => {
    const relationships: Array<{from: string, to: string, type: string}> = [];
    
    // Create some logical relationships between sections
    for (let i = 0; i < sections.length - 1; i++) {
      relationships.push({
        from: sections[i].title,
        to: sections[i + 1].title,
        type: "leads to"
      });
    }
    
    // Add some relationships based on content similarity
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 2; j < sections.length; j++) {
        // Skip adjacent sections (already connected)
        if (j === i + 1) continue;
        
        // Check if sections share keywords or references
        const fromContent = sections[i].content.toLowerCase();
        const toContent = sections[j].content.toLowerCase();
        
        // Look for shared keywords
        const sharedKeywords = keywords.filter(kw => 
          fromContent.includes(kw.toLowerCase()) && 
          toContent.includes(kw.toLowerCase())
        );
        
        if (sharedKeywords.length > 0) {
          relationships.push({
            from: sections[i].title,
            to: sections[j].title,
            type: "related"
          });
        }
      }
    }
    
    return relationships.slice(0, 8); // Limit to 8 relationships to avoid clutter
  };

  // Handle dialog close with escape key or outside click
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeVisualizerModal();
    }
  };

  return (
    <Dialog open={isVisualizerModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" onPointerDownOutside={(e) => {
        // Prevent pointer down outside from triggering other elements
        e.preventDefault();
      }}>
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            Document Structure Flowchart
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-4 top-4" 
            onClick={(e) => {
              e.stopPropagation();
              closeVisualizerModal();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 mt-4 bg-gray-50 rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div ref={containerRef} className="h-full w-full flex items-center justify-center overflow-auto p-4 bg-white rounded-lg shadow-sm">
              {/* Flowchart will be rendered here */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizerModal;
