
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

/**
 * Takes user input and allows conversational chat about the PDF content
 * @param userMessage User's message or question about the PDF
 * @returns AI response
 */
export const chatWithGeminiAboutPdf = async (userMessage: string): Promise<string> => {
  try {
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText) {
      throw new Error("No PDF content found. Please upload a PDF document first.");
    }

    // For development, create a mock response based on the question
    return createMockChatResponse(userMessage, pdfText);
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
};

/**
 * Generates a structured summary of the PDF content
 * @returns An object with different sections of the summary
 */
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText) {
      throw new Error("No PDF content found. Please upload a PDF document first.");
    }

    // Generate a mock structured summary
    return generateMockStructuredSummary(pdfText);
  } catch (error) {
    console.error("Error in generateStructuredSummary:", error);
    throw error;
  }
};

/**
 * Generates a flowchart from PDF content
 * @returns A string containing Mermaid flowchart syntax
 */
export const generateFlowchartFromPdf = async (): Promise<string> => {
  try {
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText) {
      throw new Error("No PDF content found. Please upload a PDF document first.");
    }

    // Generate a mock flowchart
    return generateMockFlowchart(pdfText);
  } catch (error) {
    console.error("Error in generateFlowchartFromPdf:", error);
    throw error;
  }
};

/**
 * Generates a sequence diagram from PDF content
 * @returns A string containing Mermaid sequence diagram syntax
 */
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText) {
      throw new Error("No PDF content found. Please upload a PDF document first.");
    }

    // Generate a mock sequence diagram
    return generateMockSequenceDiagram(pdfText);
  } catch (error) {
    console.error("Error in generateSequenceDiagramFromPdf:", error);
    throw error;
  }
};

/**
 * Generates a mindmap from direct text input (for PDF Upload page)
 * Same functionality as generateMindmapFromPdf but with direct text input
 * @param text The text content to generate a mindmap from
 * @returns Generated mindmap data
 */
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    // Store the text in session storage for other functions to use
    sessionStorage.setItem("pdfText", text);
    
    // Generate a mock mindmap structure
    const mindmap = generateMockMindmap(text);
    
    // For consistency with the expected return format
    return {
      nodes: extractNodesFromMindmap(mindmap),
      rawMermaid: mindmap
    };
  } catch (error) {
    console.error("Error in generateMindMapFromText:", error);
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
  
  // Make title short with line breaks for readability
  const titleWords = title.split(' ');
  let formattedTitle = '';
  let currentLine = '';
  
  for (const word of titleWords) {
    if (currentLine.length + word.length > 25) {
      formattedTitle += currentLine.trim() + '\n';
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  formattedTitle += currentLine.trim();
  
  if (formattedTitle.split('\n').length > 4) {
    formattedTitle = formattedTitle.split('\n').slice(0, 4).join('\n');
  }

  // Look for potential section keywords in the text
  const sections: Record<string, string[]> = {
    "Introduction 📝": [],
    "Methods 🧪": [],
    "Results 📊": [],
    "Discussion 💭": [],
    "Conclusion 🎯": []
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
  root(("${formattedTitle}"))\n`;

  // Add main sections with subsections
  Object.keys(sections).forEach(section => {
    if (sections[section].length > 0 || section.includes("Introduction")) {
      const sectionId = `section_${section.toLowerCase().replace(/\s/g, '_').replace(/[^\w]/g, '')}`;
      mindmap += `  root --> ${sectionId}["${section}"]\n`;
      
      // Add subsections based on keywords
      if (section.includes("Introduction")) {
        mindmap += `    ${sectionId} --> intro_background("📚 Background and Context")\n`;
        mindmap += `    ${sectionId} --> intro_objective("🎯 Research Objectives")\n`;
        
        // Add any found keywords for introduction
        sections[section].forEach((keyword, i) => {
          if (i < 3) { // Limit to 3 additional nodes
            mindmap += `    intro_objective --> obj_${i}{"${keyword}"}\n`;
          }
        });
      }
      else if (section.includes("Methods")) {
        mindmap += `    ${sectionId} --> methods_approach("🔬 Experimental Approach")\n`;
        
        // Add method details from keywords
        sections[section].forEach((keyword, i) => {
          mindmap += `    methods_approach --> method_${i}("${keyword}")\n`;
        });
      }
      else if (section.includes("Results")) {
        mindmap += `    ${sectionId} --> results_findings("📈 Key Findings")\n`;
        mindmap += `    ${sectionId} --> results_analysis("🔎 Data Analysis")\n`;
        
        // Add result details from keywords
        sections[section].forEach((keyword, i) => {
          if (i < 3) {
            mindmap += `    results_findings --> finding_${i}>"${keyword}"]\n`;
          } else {
            mindmap += `    results_analysis --> analysis_${i-3}>"${keyword}"]\n`;
          }
        });
      }
      else if (section.includes("Discussion")) {
        mindmap += `    ${sectionId} --> disc_implications("💡 Implications")\n`;
        mindmap += `    ${sectionId} --> disc_limitations("⚠️ Limitations")\n`;
        
        // Add discussion points from keywords
        sections[section].forEach((keyword, i) => {
          if (i % 2 === 0) {
            mindmap += `    disc_implications --> imp_${i}{"${keyword}"}\n`;
          } else {
            mindmap += `    disc_limitations --> lim_${i}{"${keyword}"}\n`;
          }
        });
      }
      else if (section.includes("Conclusion")) {
        mindmap += `    ${sectionId} --> conclusion_summary("📋 Summary")\n`;
        mindmap += `    ${sectionId} --> conclusion_future("🔮 Future Work")\n`;
        
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
    "Introduction 📝": [],
    "Methods 🧪": [],
    "Results 📊": [],
    "Discussion 💭": [],
    "Conclusion 🎯": []
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
      categorized["Methods 🧪"].push(keyword);
    }
    else if (resultTerms.some(term => lower.includes(term))) {
      categorized["Results 📊"].push(keyword);
    }
    else if (discussionTerms.some(term => lower.includes(term))) {
      categorized["Discussion 💭"].push(keyword);
    }
    else if (conclusionTerms.some(term => lower.includes(term))) {
      categorized["Conclusion 🎯"].push(keyword);
    }
    else {
      categorized["Introduction 📝"].push(keyword);
    }
  });
  
  return categorized;
};

// Helper function for mock chat responses
const createMockChatResponse = (userMessage: string, pdfText: string): string => {
  const lowerUserMsg = userMessage.toLowerCase();
  
  // Generate a response based on question keywords
  if (lowerUserMsg.includes('summary') || lowerUserMsg.includes('summarize')) {
    return "📄 Based on the paper, the main focus is on [citation:page1] improving quantum dot efficiency through surface modification. The authors demonstrated a [citation:page3] 45% increase in photoluminescence when using the novel coating technique. The implications for quantum computing and biomedical imaging are significant! 🔬";
  } 
  else if (lowerUserMsg.includes('method') || lowerUserMsg.includes('how')) {
    return "🧪 The methodology involved synthesizing CdSe quantum dots using a modified sol-gel approach [citation:page2]. The samples were then characterized using absorption and emission spectroscopy, with TEM imaging confirming the size distribution [citation:page4]. Statistical analysis was performed using GraphPad Prism software. 📊";
  }
  else if (lowerUserMsg.includes('result') || lowerUserMsg.includes('finding')) {
    return "📈 The key results show that surface passivation with the novel polymer reduced trap states by approximately 78% [citation:page5]. Quantum yield increased from 32% to 76% under optimal conditions. Figure 3 [citation:page6] demonstrates the correlation between ligand concentration and emission intensity. 💡";
  }
  else if (lowerUserMsg.includes('conclusion') || lowerUserMsg.includes('future')) {
    return "🎯 The authors concluded that their approach offers a scalable method for enhancing quantum dot performance [citation:page8]. Future work will focus on applying this technique to other nanomaterials and exploring applications in bioimaging. The work provides important insights into surface chemistry effects on optoelectronic properties! 🔮";
  }
  else if (lowerUserMsg.includes('explain')) {
    // Extract the text to explain
    const textToExplain = userMessage.replace(/please explain/i, '').replace(/explain/i, '').trim();
    return `💡 "${textToExplain}" refers to the process where surface-bound ligands interact with quantum dot electronic states. As explained on [citation:page3], this interaction passivates dangling bonds that would otherwise act as non-radiative recombination centers. Think of it as filling in the "potholes" on the quantum dot surface that would normally trap electrons and prevent them from emitting light! 🌟`;
  }
  else {
    // Generic response for other questions
    return "📚 Based on my analysis of the paper, the research focuses on quantum dot optimization through surface chemistry engineering. The authors demonstrated significant improvements in optical properties [citation:page3] and discussed the mechanisms behind the enhanced performance [citation:page7]. Would you like me to elaborate on a specific aspect of their work? 🔍";
  }
};

// Helper function to generate a structured summary
const generateMockStructuredSummary = (pdfText: string): Record<string, string> => {
  return {
    "Summary": "This paper presents a novel approach for enhancing quantum dot efficiency through surface modification techniques. The researchers developed a polymer coating method that significantly reduces surface trap states, resulting in improved photoluminescence quantum yield. The work has implications for quantum computing, display technologies, and biomedical imaging. [citation:page1]",
    
    "Key Findings": "• 76% quantum yield achieved with optimized surface coating [citation:page5]\n• 78% reduction in surface trap states compared to conventional methods [citation:page6]\n• Thermal stability improved by 45°C [citation:page7]\n• Simplified synthesis process requiring fewer purification steps [citation:page3]",
    
    "Objectives": "The research aimed to address the efficiency limitations of quantum dots by developing a novel surface passivation strategy. The specific goals included: [citation:page2]\n• Creating a more robust ligand system resistant to photooxidation\n• Developing a scalable synthesis approach compatible with existing manufacturing processes\n• Demonstrating the applicability across multiple quantum dot compositions",
    
    "Methods": "The researchers employed a modified sol-gel approach for quantum dot synthesis, followed by a post-synthetic ligand exchange process. [citation:page2] Characterization techniques included:\n• UV-Vis and photoluminescence spectroscopy [citation:page4]\n• Time-resolved spectroscopy to measure carrier lifetimes [citation:page5]\n• Transmission electron microscopy for morphological analysis [citation:page4]\n• Thermogravimetric analysis for thermal stability assessment [citation:page6]",
    
    "Results": "The novel polymer coating demonstrated superior performance compared to conventional methods:\n• Emission peak at 535 nm showed 2.5x intensity increase [citation:page5]\n• Quantum yield increased from 32% to 76% [citation:page5]\n• Surface trap density decreased from 3.8×10^14 to 8.2×10^13 cm^-2 [citation:page6]\n• Fluorescence lifetime increased from 18 ns to 32 ns [citation:page7]",
    
    "Conclusions": "The authors concluded that their approach offers a practical solution to a longstanding challenge in quantum dot technology. The simplified synthesis and enhanced performance metrics make this approach promising for commercial applications. [citation:page8] The work provides fundamental insights into surface chemistry effects on optoelectronic properties of nanomaterials.",
    
    "Key Concepts": "• Quantum confinement effects [citation:page1]\n• Surface passivation strategies [citation:page2]\n• Non-radiative recombination mechanisms [citation:page3]\n• Core-shell nanostructures [citation:page4]\n• Ligand exchange dynamics [citation:page5]\n• Thermal and photochemical stability [citation:page7]"
  };
};

// Helper function to generate a mock flowchart
const generateMockFlowchart = (pdfText: string): string => {
  return `flowchart LR
    A[Quantum Dot Synthesis] --> B{Ligand Exchange?}
    B -->|Yes| C[Polymer Coating Process]
    B -->|No| D[Direct Application]
    C --> E[Characterization]
    D --> E
    E --> F{QY > 50%?}
    F -->|Yes| G[High Efficiency QDs]
    F -->|No| H[Optimization Loop]
    H --> B
    
    classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:2px
    classDef decision fill:#D3E4FD,stroke:#0EA5E9,stroke-width:2px
    classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:2px
    classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:2px`;
};

// Helper function to generate a mock sequence diagram
const generateMockSequenceDiagram = (pdfText: string): string => {
  return `sequenceDiagram
    participant S as Synthesis
    participant C as Characterization
    participant A as Analysis
    participant O as Optimization
    
    S->>C: Raw Quantum Dots
    C->>A: Spectroscopic Data
    A->>O: Performance Metrics
    O->>S: Modified Parameters
    C->>C: Time-Resolved PL
    C->>A: Decay Curves
    A->>O: Lifetime Analysis
    O->>S: Surface Chemistry Adjustment`;
};

// Helper function to extract nodes from a mermaid mindmap string
const extractNodesFromMindmap = (mindmapString: string): any[] => {
  const nodes: any[] = [];
  const lines = mindmapString.split('\n');
  
  // Skip the first line which is just 'mindmap'
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Extract node information using regex
    const nodeMatch = line.match(/(\s*)([^-]+)\s*-->\s*([^[("]+)(?:\["([^"]+)"\]|\("([^"]+)"\)|{"([^"]+)"})?\s*/);
    
    if (nodeMatch) {
      const indentation = nodeMatch[1].length;
      const parentId = nodeMatch[2].trim();
      const nodeId = nodeMatch[3].trim();
      const nodeText = nodeMatch[4] || nodeMatch[5] || nodeMatch[6] || nodeId;
      
      nodes.push({
        id: nodeId,
        text: nodeText,
        parent: parentId === 'root' ? null : parentId,
        level: indentation / 2
      });
    }
  }
  
  return nodes;
};
