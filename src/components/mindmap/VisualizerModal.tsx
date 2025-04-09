
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

// Initialize mermaid with a more elegant, colorful theme
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    curve: 'basis',
    diagramPadding: 8,
    htmlLabels: true,
  },
  themeVariables: {
    primaryColor: "#F2FCE2",        // Soft Green
    primaryTextColor: "#555555",    // Dark gray for text
    primaryBorderColor: "#D3E4FD",  // Soft Blue
    lineColor: "#9DB5B2",           // Muted teal
    secondaryColor: "#FEF7CD",      // Soft Yellow
    tertiaryColor: "#FFDEE2",       // Soft Pink
    noteBackgroundColor: "#E5DEFF", // Soft Purple
    noteBorderColor: "#8B5CF6",     // Vivid Purple
    edgeLabelBackground: "#FDE1D3", // Soft Peach
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
      const { sections, keywords, concepts, title } = extractDocumentStructure(pdfData);
      
      // Generate enhanced flowchart with extracted data
      const definition = generateEnhancedFlowchart(title, sections, keywords, concepts);
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
    // Extract title
    const title = extractTitle(pdfText);
    
    // Extract sections with advanced pattern recognition
    const sections = extractSections(pdfText);
    
    // Extract keywords with frequency analysis
    const keywords = extractKeywords(pdfText);
    
    // Extract key concepts and findings
    const concepts = extractKeyConcepts(pdfText);
    
    return { title, sections, keywords, concepts };
  };

  // Generate elegant, colorful flowchart with real content from the paper
  const generateEnhancedFlowchart = (
    title: string,
    sections: Array<{title: string, content: string}>, 
    keywords: string[], 
    concepts: string[]
  ) => {
    // Pastel color palette for nodes
    const nodeColors = [
      "F2FCE2", // Soft Green
      "FEF7CD", // Soft Yellow 
      "FEC6A1", // Soft Orange
      "E5DEFF", // Soft Purple
      "FFDEE2", // Soft Pink
      "FDE1D3", // Soft Peach
      "D3E4FD", // Soft Blue
      "F1F0FB"  // Soft Gray
    ];
    
    // Initialize flowchart
    let flowchart = `flowchart TD\n`;
    
    // Add custom styling classes
    flowchart += `    classDef default fill:#F2FCE2,stroke:#9DB5B2,stroke-width:1px,color:#555555,font-size:14px\n`;
    
    // Create classes for each color
    nodeColors.forEach((color, index) => {
      flowchart += `    classDef color${index} fill:#${color},stroke:#9DB5B2,stroke-width:1px,color:#555555,font-size:14px\n`;
    });
    
    // Special styling for title and main nodes
    flowchart += `    classDef titleStyle fill:#F1F0FB,stroke:#8B5CF6,stroke-width:2px,color:#555555,font-size:16px,font-weight:bold\n`;
    flowchart += `    classDef mainStyle fill:#D3E4FD,stroke:#0EA5E9,stroke-width:1.5px,color:#555555,font-size:15px\n`;
    flowchart += `    classDef conceptStyle fill:#FFDEE2,stroke:#D946EF,stroke-width:1px,color:#555555,font-size:14px\n`;
    
    // Format paper title (truncate if too long)
    const formattedTitle = title.length > 60 ? title.substring(0, 58) + "..." : title;
    
    // Add root node with actual paper title
    flowchart += `    root([\"${escapeQuotes(formattedTitle)}\"]):::titleStyle\n`;
    
    // Add main content node
    flowchart += `    main[\"Main Content\"]:::mainStyle\n`;
    flowchart += `    root --> main\n`;
    
    // Add actual sections from the paper with different colors
    let sectionNodes: string[] = [];
    
    sections.forEach((section, index) => {
      if (!section.title || section.title.length < 3) return; // Skip invalid sections
      
      const nodeId = `section${index}`;
      sectionNodes.push(nodeId);
      const colorClass = `color${index % nodeColors.length}`;
      
      // Format section title (truncate if too long)
      const sectionTitle = section.title.length > 40 
        ? section.title.substring(0, 38) + "..." 
        : section.title;
      
      // Add section node
      flowchart += `    ${nodeId}[\"${escapeQuotes(sectionTitle)}\"]:::${colorClass}\n`;
      flowchart += `    main --> ${nodeId}\n`;
      
      // Extract key finding or content from the section
      if (section.content && section.content.length > 10) {
        const keyPoints = extractKeySentence(section.content);
        if (keyPoints) {
          const contentNodeId = `${nodeId}_content`;
          flowchart += `    ${contentNodeId}[\"${escapeQuotes(keyPoints)}\"]:::${colorClass}\n`;
          flowchart += `    ${nodeId} --> ${contentNodeId}\n`;
        }
      }
    });
    
    // Add connections between sections (sequential flow)
    for (let i = 0; i < sectionNodes.length - 1; i++) {
      // Only connect sections that should logically flow
      const isConnectable = shouldConnectSections(sections[i].title, sections[i+1].title);
      
      if (isConnectable) {
        const relationshipType = determineRelationship(sections[i].title, sections[i+1].title);
        flowchart += `    ${sectionNodes[i]} -.-> |${relationshipType}| ${sectionNodes[i+1]}\n`;
      }
    }
    
    // Add key concepts node with actual concepts from the paper
    if (concepts.length > 0) {
      flowchart += `    concepts[\"Key Concepts\"]:::conceptStyle\n`;
      flowchart += `    root --> concepts\n`;
      
      // Add actual concepts as nodes
      concepts.slice(0, 5).forEach((concept, index) => {
        const conceptNodeId = `concept${index}`;
        const colorIndex = (index + 4) % nodeColors.length;
        flowchart += `    ${conceptNodeId}[\"${escapeQuotes(concept)}\"]:::color${colorIndex}\n`;
        flowchart += `    concepts --> ${conceptNodeId}\n`;
      });
    }
    
    // Add keywords node with actual keywords from the paper
    if (keywords.length > 0) {
      flowchart += `    keywords[\"Key Terms\"]:::color4\n`;
      flowchart += `    root --> keywords\n`;
      
      // Add actual keywords from the paper
      keywords.slice(0, 5).forEach((keyword, index) => {
        const keywordNodeId = `kw${index}`;
        const colorIndex = (index + 2) % nodeColors.length;
        flowchart += `    ${keywordNodeId}[\"${escapeQuotes(keyword)}\"]:::color${colorIndex}\n`;
        flowchart += `    keywords --> ${keywordNodeId}\n`;
      });
    }
    
    return flowchart;
  };

  // Helper function to escape quotes in strings for mermaid
  const escapeQuotes = (text: string) => {
    return text.replace(/"/g, '\\"');
  };

  // Helper function to extract title from PDF text
  const extractTitle = (pdfText: string): string => {
    const lines = pdfText.split('\n');
    
    // Look for the title in the first few non-empty lines
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      
      // Title criteria: not too short, not too long, not common headers
      if (line.length > 15 && line.length < 200 && 
          !/^(abstract|introduction|keywords|contents|chapter)/i.test(line)) {
        return line;
      }
    }
    
    return "Research Paper Analysis";
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
      /^(?:FUTURE WORK|Future Work)/i,
      /^(?:APPENDIX|Appendix)/i,
      /^(?:\d+\.?\s+[A-Z][a-z]+)/  // Numbered sections like "1. Introduction"
    ];
    
    // Look for section headers
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
         /^\d+\.?\s+[A-Z]/.test(line) ||
         /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line));
      
      if (isSectionHeader) {
        // Save previous section before starting a new one
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.trim()
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
        content: currentContent.trim()
      });
    }
    
    // If no sections found, create some generic ones based on content analysis
    if (sections.length < 3) {
      // Try to extract a title (already done separately)
      
      // Create generic sections
      const firstThird = Math.floor(pdfText.length / 3);
      const secondThird = firstThird * 2;
      
      sections.push({ title: "Introduction", content: pdfText.substring(0, firstThird) });
      sections.push({ title: "Main Content", content: pdfText.substring(firstThird, secondThird) });
      sections.push({ title: "Conclusion", content: pdfText.substring(secondThird) });
    }
    
    return sections;
  };

  // Helper function to extract key sentence from content
  const extractKeySentence = (content: string): string => {
    if (!content || content.length < 20) return "";
    
    // Split into sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    // Look for sentences with key indicators
    const keyIndicators = [
      /significant/i, /important/i, /key/i, /main/i, /primary/i, 
      /found that/i, /conclude/i, /results show/i, /demonstrates/i,
      /\d+%/i, /increase/i, /decrease/i, /impact/i, /effect/i,
      /p\s*<\s*0\.0\d+/i  // p-value
    ];
    
    // First look for sentences with key indicators
    for (const sentence of sentences) {
      if (keyIndicators.some(pattern => pattern.test(sentence)) && 
          sentence.length > 20 && sentence.length < 150) {
        return sentence.trim();
      }
    }
    
    // If no good indicator sentences, just take the first reasonable sentence
    for (const sentence of sentences) {
      if (sentence.length > 20 && sentence.length < 150) {
        return sentence.trim();
      }
    }
    
    // Fallback to first 100 chars
    return content.substring(0, 100).trim() + "...";
  };

  // Helper function to extract keywords from PDF text
  const extractKeywords = (pdfText: string): string[] => {
    // First try to find explicit keywords section
    const keywordMatch = pdfText.match(/keywords?\s*:?\s*([^.;]*)[.;]/i) || 
                        pdfText.match(/key\s+words?\s*:?\s*([^.;]*)[.;]/i);
    
    if (keywordMatch && keywordMatch[1]) {
      const keywordText = keywordMatch[1].trim();
      // Split by commas, semicolons, or 'and'
      const explicitKeywords = keywordText.split(/[,;]\s*|\s+and\s+/i)
        .map(k => k.trim())
        .filter(k => k.length > 2 && k.length < 30);
      
      if (explicitKeywords.length >= 3) {
        return explicitKeywords;
      }
    }
    
    // If explicit keywords not found, extract based on frequency and capitalization
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
    
    return [...new Set(potentialKeywords)].slice(0, 8);
  };

  // Helper function to extract key concepts from the paper
  const extractKeyConcepts = (pdfText: string): string[] => {
    // Look for explicit statements of contribution or findings
    const contributionPatterns = [
      /(?:our|the main|key|primary)\s+contribution[s]?\s+(?:is|are|include[s]?)[^.]*\./gi,
      /(?:we|this paper|this study|this research)\s+(?:demonstrate[s]?|show[s]?|find[s]?|present[s]?)[^.]*\./gi,
      /(?:key|main|important|significant)\s+(?:finding[s]?|result[s]?|insight[s]?)[^.]*\./gi,
      /(?:this|the)\s+(?:study|paper|research|work)\s+(?:addresses|solves|improves|enhances)[^.]*\./gi
    ];
    
    const concepts: string[] = [];
    
    // Extract sentences matching these patterns
    for (const pattern of contributionPatterns) {
      const matches = pdfText.match(pattern) || [];
      for (const match of matches) {
        // Extract the core concept from the sentence
        let concept = match.trim();
        
        // Remove common prefixes
        concept = concept.replace(/^(?:our|the main|key|primary)\s+contribution[s]?\s+(?:is|are|include[s]?)\s+/i, '');
        concept = concept.replace(/^(?:we|this paper|this study|this research)\s+(?:demonstrate[s]?|show[s]?|find[s]?|present[s]?)\s+/i, '');
        concept = concept.replace(/^(?:key|main|important|significant)\s+(?:finding[s]?|result[s]?|insight[s]?)\s+(?:is|are|include[s]?)?\s+/i, '');
        concept = concept.replace(/^(?:this|the)\s+(?:study|paper|research|work)\s+(?:addresses|solves|improves|enhances)\s+/i, '');
        
        // Truncate if too long
        if (concept.length > 60) {
          concept = concept.substring(0, 58) + "...";
        }
        
        // Add to list if not too short
        if (concept.length > 10) {
          concepts.push(concept);
        }
      }
    }
    
    // If we couldn't find explicit concepts, generate some from section content
    if (concepts.length < 3) {
      const sections = extractSections(pdfText);
      
      // Extract from introduction and conclusion
      const introSection = sections.find(s => /introduction/i.test(s.title));
      const concSection = sections.find(s => /conclusion/i.test(s.title));
      
      if (introSection && introSection.content) {
        const sentences = introSection.content.match(/[^.!?]+[.!?]+/g) || [];
        // Look for goal/purpose statements
        for (const sentence of sentences) {
          if (/(?:goal|aim|purpose|objective|we propose|we present|we introduce)/i.test(sentence) && 
              sentence.length > 20 && sentence.length < 150) {
            concepts.push(sentence.trim());
            break;
          }
        }
      }
      
      if (concSection && concSection.content) {
        const sentences = concSection.content.match(/[^.!?]+[.!?]+/g) || [];
        // Look for summary statements
        for (const sentence of sentences) {
          if (/(?:in summary|to summarize|in conclusion|we have demonstrated|results show|we found)/i.test(sentence) && 
              sentence.length > 20 && sentence.length < 150) {
            concepts.push(sentence.trim());
            break;
          }
        }
      }
    }
    
    // Ensure we have at least some concepts
    if (concepts.length < 2) {
      concepts.push("Main research focus of this paper");
      concepts.push("Key methodology used in this study");
      concepts.push("Central finding or conclusion");
    }
    
    return [...new Set(concepts)].slice(0, 5);
  };

  // Helper function to determine if two sections should be connected
  const shouldConnectSections = (section1Title: string, section2Title: string): boolean => {
    // Define logical flows between sections
    const logicalFlows: [RegExp, RegExp][] = [
      [/abstract/i, /introduction/i],
      [/introduction/i, /(?:background|literature|related work)/i],
      [/(?:background|literature|related work)/i, /(?:methodology|methods|materials|approach)/i],
      [/(?:methodology|methods|materials|approach)/i, /(?:results|findings|analysis)/i],
      [/(?:results|findings|analysis)/i, /(?:discussion|interpretation)/i],
      [/(?:discussion|interpretation)/i, /(?:conclusion|future work|limitations)/i],
      [/(?:conclusion|future work|limitations)/i, /(?:references|bibliography)/i]
    ];
    
    // Check if the sections follow a logical flow
    return logicalFlows.some(([pattern1, pattern2]) => 
      pattern1.test(section1Title) && pattern2.test(section2Title)
    );
  };

  // Helper function to determine the relationship between two sections
  const determineRelationship = (section1Title: string, section2Title: string): string => {
    // Define specific relationships
    if (/introduction/i.test(section1Title) && /methodology/i.test(section2Title)) {
      return "leads to";
    } else if (/methodology/i.test(section1Title) && /results/i.test(section2Title)) {
      return "produces";
    } else if (/results/i.test(section1Title) && /discussion/i.test(section2Title)) {
      return "analyzed in";
    } else if (/discussion/i.test(section1Title) && /conclusion/i.test(section2Title)) {
      return "summarized in";
    } else {
      return "leads to";
    }
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
        e.stopPropagation();
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
