
import { useToast } from "@/hooks/use-toast";

/**
 * Generates a mindmap from PDF content using Gemini API
 * @returns A string containing Mermaid mindmap syntax
 */
export const generateMindmapFromPdf = async (): Promise<string> => {
  try {
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText) {
      throw new Error("No PDF content found. Please upload a PDF document first.");
    }

    // Extract the first 15000 characters to avoid token limitations
    // This is enough text for Gemini to understand the paper structure
    const truncatedText = pdfText.substring(0, 15000);

    // Create a prompt that instructs Gemini to create a detailed mindmap
    const prompt = `
      Create a detailed Mermaid.js syntax mindmap based on this academic paper text. 
      The mindmap should:
      1. Have a structured hierarchy with main sections and subsections
      2. Include relevant concepts, methods, results, and discussions
      3. Use proper Mermaid.js mindmap syntax with root node and branches
      4. Be detailed with at least 3 levels of depth
      5. Use varied node styles in Mermaid (brackets, parentheses, etc.)
      6. NOT include any text styling like colors or classes (I'll apply those separately)

      Paper text:
      ${truncatedText}

      Return ONLY the valid Mermaid mindmap code without any explanation or commentary.
      Start with 'mindmap' and then structure the content.
    `;

    // For development purposes, return a mock response since we don't have the actual Gemini API connected
    // In a real implementation, this would call the Gemini API
    return generateMockMindmap(truncatedText);
  } catch (error) {
    console.error("Error in generateMindmapFromPdf:", error);
    throw error;
  }
};

// Helper function to generate a mock mindmap based on text content
// This simulates what Gemini would return
const generateMockMindmap = (text: string): string => {
  // Extract potential title and sections from text
  const lines = text.split('\n');
  let title = "Paper Analysis";
  
  // Try to find a title in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line && line.length > 10 && line.length < 100 && !line.includes('http')) {
      title = line;
      break;
    }
  }

  // Look for potential section keywords in the text
  const sections: Record<string, string[]> = {
    "Introduction": [],
    "Methods": [],
    "Results": [],
    "Discussion": [],
    "Conclusion": []
  };

  // Simple keyword extraction to identify potential topics
  const keywords = extractKeywords(text);
  const sectionKeywords = categorizeKeywords(keywords);

  // Populate sections with found keywords
  Object.keys(sectionKeywords).forEach(section => {
    if (sectionKeywords[section].length > 0) {
      sections[section] = sectionKeywords[section].slice(0, 5); // Take top 5 keywords per section
    }
  });

  // Create the mindmap structure
  let mindmap = `mindmap
  root(("${title.substring(0, 50)}"))\n`;

  // Add main sections with subsections
  Object.keys(sections).forEach(section => {
    if (sections[section].length > 0 || section === "Introduction") {
      const sectionId = `section_${section.toLowerCase().replace(/\s/g, '_')}`;
      mindmap += `  root --> ${sectionId}["${section}"]\n`;
      
      // Add subsections based on keywords
      if (section === "Introduction") {
        mindmap += `    ${sectionId} --> intro_background("Background and Context")\n`;
        mindmap += `    ${sectionId} --> intro_objective("Research Objectives")\n`;
        
        // Add any found keywords for introduction
        sections[section].forEach((keyword, i) => {
          if (i < 3) { // Limit to 3 additional nodes
            mindmap += `    intro_objective --> obj_${i}{"${keyword}"}\n`;
          }
        });
      }
      else if (section === "Methods") {
        mindmap += `    ${sectionId} --> methods_approach("Experimental Approach")\n`;
        
        // Add method details from keywords
        sections[section].forEach((keyword, i) => {
          mindmap += `    methods_approach --> method_${i}("${keyword}")\n`;
        });
      }
      else if (section === "Results") {
        mindmap += `    ${sectionId} --> results_findings("Key Findings")\n`;
        mindmap += `    ${sectionId} --> results_analysis("Data Analysis")\n`;
        
        // Add result details from keywords
        sections[section].forEach((keyword, i) => {
          if (i < 3) {
            mindmap += `    results_findings --> finding_${i}>"${keyword}"]\n`;
          } else {
            mindmap += `    results_analysis --> analysis_${i-3}>"${keyword}"]\n`;
          }
        });
      }
      else if (section === "Discussion") {
        mindmap += `    ${sectionId} --> disc_implications("Implications")\n`;
        mindmap += `    ${sectionId} --> disc_limitations("Limitations")\n`;
        
        // Add discussion points from keywords
        sections[section].forEach((keyword, i) => {
          if (i % 2 === 0) {
            mindmap += `    disc_implications --> imp_${i}{"${keyword}"}\n`;
          } else {
            mindmap += `    disc_limitations --> lim_${i}{"${keyword}"}\n`;
          }
        });
      }
      else if (section === "Conclusion") {
        mindmap += `    ${sectionId} --> conclusion_summary("Summary")\n`;
        mindmap += `    ${sectionId} --> conclusion_future("Future Work")\n`;
        
        // Add conclusion points from keywords
        sections[section].forEach((keyword, i) => {
          if (i < 2) {
            mindmap += `    conclusion_summary --> summary_${i}("${keyword}")\n`;
          } else {
            mindmap += `    conclusion_future --> future_${i-2}("${keyword}")\n`;
          }
        });
      }
    }
  });

  return mindmap;
};

// Extract potential keywords from text
const extractKeywords = (text: string): string[] => {
  // Convert text to lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // List of academic/scientific terms to look for
  const academicTerms = [
    "quantum", "dots", "emission", "enhancement", "surface", "trap", 
    "photoluminescence", "plasmon", "resonance", "cds", "cdse", 
    "nanoparticles", "polymer", "coating", "isotherm", "extraction", 
    "spectrum", "band", "gap", "extinction", "luminescence", "quenching",
    "synthesis", "characterization", "analysis", "methodology", "fabrication",
    "thermal", "optical", "electronic", "properties", "efficiency", "yield",
    "spectroscopy", "microscopy", "diffraction", "computational", "theoretical",
    "model", "simulation", "experiment", "validation", "parameters", "variables",
    "factors", "concentration", "temperature", "pressure", "catalyst",
    "reaction", "mechanism", "kinetics", "thermodynamics", "energy", "transfer"
  ];
  
  // Extract potential keywords based on frequency and context
  const keywords: string[] = [];
  
  academicTerms.forEach(term => {
    // Count occurrences of the term
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    
    if (matches && matches.length > 2) {
      // Get surrounding words for context
      const contextRegex = new RegExp(`.{0,20}\\b${term}\\b.{0,20}`, 'gi');
      const contextMatches = text.match(contextRegex);
      
      if (contextMatches && contextMatches.length > 0) {
        // Extract phrases containing the term
        contextMatches.slice(0, 2).forEach(context => {
          // Find noun phrases containing the term
          const words = context.split(/\s+/);
          const termIndex = words.findIndex(word => 
            word.toLowerCase().includes(term.toLowerCase())
          );
          
          if (termIndex >= 0) {
            // Take up to 3 words before and after the term to form a phrase
            const start = Math.max(0, termIndex - 2);
            const end = Math.min(words.length, termIndex + 3);
            const phrase = words.slice(start, end)
              .join(' ')
              .replace(/[,.;:()\[\]{}]/g, '') // Remove punctuation
              .trim();
            
            if (phrase.length > term.length && 
                !keywords.some(k => k.toLowerCase().includes(phrase.toLowerCase()))) {
              keywords.push(phrase);
            }
          }
        });
      }
      
      // If no good context was found, just add the term itself
      if (!keywords.some(k => k.toLowerCase().includes(term.toLowerCase()))) {
        keywords.push(term);
      }
    }
  });
  
  return keywords;
};

// Categorize keywords into paper sections
const categorizeKeywords = (keywords: string[]): Record<string, string[]> => {
  const categorized: Record<string, string[]> = {
    "Introduction": [],
    "Methods": [],
    "Results": [],
    "Discussion": [],
    "Conclusion": []
  };
  
  // Method-related terms
  const methodTerms = [
    "synthesis", "preparation", "fabrication", "characterization", 
    "methodology", "technique", "approach", "procedure", "protocol",
    "experimental", "setup", "apparatus", "equipment", "instrument",
    "measurement", "analysis", "method", "process", "design"
  ];
  
  // Result-related terms
  const resultTerms = [
    "result", "data", "observation", "measurement", "value", 
    "finding", "outcome", "output", "yield", "efficiency",
    "performance", "spectrum", "spectra", "plot", "graph", 
    "figure", "table", "enhancement", "increase", "decrease"
  ];
  
  // Discussion-related terms
  const discussionTerms = [
    "mechanism", "explanation", "interpretation", "hypothesis",
    "theory", "model", "framework", "comparison", "correlation",
    "relationship", "effect", "impact", "influence", "significance",
    "implication", "consequence", "limitation", "challenge", "issue"
  ];
  
  // Conclusion-related terms
  const conclusionTerms = [
    "conclusion", "summary", "overview", "perspective", "future",
    "direction", "recommendation", "outlook", "prospect", "implication",
    "application", "significance", "importance", "relevance", "contribution"
  ];
  
  // Categorize each keyword
  keywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    
    if (methodTerms.some(term => lower.includes(term))) {
      categorized["Methods"].push(keyword);
    }
    else if (resultTerms.some(term => lower.includes(term))) {
      categorized["Results"].push(keyword);
    }
    else if (discussionTerms.some(term => lower.includes(term))) {
      categorized["Discussion"].push(keyword);
    }
    else if (conclusionTerms.some(term => lower.includes(term))) {
      categorized["Conclusion"].push(keyword);
    }
    else {
      categorized["Introduction"].push(keyword);
    }
  });
  
  return categorized;
};
