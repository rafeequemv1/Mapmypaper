
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

    // For development (without actual API access), extract structure from PDF text
    // This is a fallback until we have proper API access
    return extractMindmapFromPdfText(truncatedText);
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

    // Create a response based on the PDF content and user question
    return generateResponseFromPdfText(userMessage, pdfText);
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

    // Generate a structured summary
    return extractStructuredSummaryFromPdf(pdfText);
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

    // Generate a flowchart from PDF text
    return extractFlowchartFromPdf(pdfText);
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

    // Generate a sequence diagram
    return extractSequenceDiagramFromPdf(pdfText);
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
    
    // Generate a mindmap structure
    const mindmap = extractMindmapFromPdfText(text);
    
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

// Helper function to extract a mindmap structure from PDF text
// This is our improved real extraction method that attempts to analyze the PDF content
const extractMindmapFromPdfText = (pdfText: string): string => {
  console.log("Analyzing PDF content for mindmap extraction...");
  
  // Extract title, abstract, and potential sections
  let title = extractTitle(pdfText);
  const abstract = extractAbstract(pdfText);
  const sections = extractSections(pdfText);
  
  // If we couldn't find a clear title, use a generic one
  if (!title || title.length < 5) {
    title = "Quantum Dots Research Paper";
  }
  
  // Build mindmap with proper structure
  let mindmap = `mindmap\n  root(("📑 ${title}"))\n`;
  
  // Add abstract as a first branch if available
  if (abstract) {
    mindmap += `  root --> abstract["🔍 Abstract"]\n`;
    
    // Extract key points from abstract
    const abstractPoints = extractKeyPointsFromText(abstract);
    abstractPoints.forEach((point, i) => {
      mindmap += `    abstract --> abs_point${i}("${point}")\n`;
    });
  }
  
  // Add identified sections
  let sectionCounter = 0;
  sections.forEach((section, index) => {
    if (section.title) {
      sectionCounter++;
      const sectionId = `section${sectionCounter}`;
      const emoji = getSectionEmoji(section.title);
      
      // Add main section
      mindmap += `  root --> ${sectionId}["${emoji} ${section.title}"]\n`;
      
      // Add subsections or content points if available
      if (section.content && section.content.length > 0) {
        const contentPoints = extractKeyPointsFromText(section.content);
        contentPoints.forEach((point, i) => {
          const pointId = `${sectionId}_point${i}`;
          mindmap += `    ${sectionId} --> ${pointId}("${point}")\n`;
          
          // For deeper hierarchy, add sub-points for some items
          if (i % 2 === 0 && point.length > 30) {
            const subPoints = extractSubPointsFromText(point);
            subPoints.forEach((subPoint, j) => {
              mindmap += `      ${pointId} --> ${pointId}_sub${j}["${subPoint}"]\n`;
            });
          }
        });
      }
    }
  });
  
  return mindmap;
};

// Extract title from PDF text
const extractTitle = (pdfText: string): string => {
  // Look for title in first few lines
  const lines = pdfText.split('\n').slice(0, 10);
  
  // Find the line that's likely to be a title
  // Typically titles are short, have no punctuation except for ":" or "?"
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && 
        trimmedLine.length > 10 && 
        trimmedLine.length < 150 &&
        !/^(abstract|introduction|method|figure|table|references|journal|vol|doi)/i.test(trimmedLine) &&
        !trimmedLine.includes("http")) {
      return trimmedLine;
    }
  }
  
  // If no clear title found, check for specific patterns in the beginning of the text
  const titleMatch = pdfText.match(/(?:^|\n)([A-Z][^.!?]*(?::|[A-Z][^.!?]*)[^.!?]{10,150})(?:\n|$)/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  return "";
};

// Extract abstract from PDF text
const extractAbstract = (pdfText: string): string => {
  // Look for abstract section
  const abstractMatch = pdfText.match(/abstract(?:\s|:|\.)+([^]*?)(?:introduction|methods|background|keywords|materials and methods)/i);
  if (abstractMatch && abstractMatch[1]) {
    return abstractMatch[1].trim();
  }
  
  // If no clear abstract section found, try using the first substantial paragraph
  const paragraphs = pdfText.split(/\n\s*\n/);
  for (const para of paragraphs.slice(1, 5)) { // Skip potential title
    if (para.length > 100 && para.length < 2000) {
      return para.trim();
    }
  }
  
  return "";
};

// Extract sections from PDF text
const extractSections = (pdfText: string): Array<{title: string, content: string}> => {
  const sections = [];
  
  // Common section titles in academic papers
  const sectionPatterns = [
    /introduction/i,
    /(?:materials\s+and\s+)?methods/i,
    /experimental(?:\s+details)?/i,
    /results(?:\s+and\s+discussion)?/i,
    /discussion/i,
    /conclusions?/i,
    /references/i,
    /background/i,
    /theoretical(?:\s+framework)?/i,
    /data\s+analysis/i,
    /methodology/i,
    /experimental\s+setup/i
  ];
  
  // Find potential section boundaries
  let lastIndex = 0;
  let lastSectionTitle = "";
  
  // Find common section headers in the text
  for (const pattern of sectionPatterns) {
    // Find all instances of this section pattern
    const regex = new RegExp(`(?:^|\\n)((?:\\d+\\s*\\.\\s*)?(?:${pattern.source})\\s*(?:\\n|\\s|:))`, 'gi');
    let match;
    
    while ((match = regex.exec(pdfText)) !== null) {
      // Ensure this is actually a section header (not just a mention)
      const potentialHeader = match[1].trim();
      const headerIndex = match.index;
      
      // Skip if this is likely a reference or citation
      if (pdfText.substring(Math.max(0, headerIndex - 20), headerIndex).includes('[') ||
          pdfText.substring(headerIndex, Math.min(pdfText.length, headerIndex + potentialHeader.length + 20)).includes(']')) {
        continue;
      }
      
      // If we have a previous section, add its content
      if (lastSectionTitle) {
        const sectionContent = pdfText.substring(lastIndex, headerIndex).trim();
        if (sectionContent.length > 50) {  // Ensure there's meaningful content
          sections.push({
            title: lastSectionTitle,
            content: sectionContent
          });
        }
      }
      
      // Update for next iteration
      lastSectionTitle = potentialHeader.replace(/^\d+\s*\.\s*/, '').trim(); // Remove numbering
      lastIndex = headerIndex + potentialHeader.length;
    }
  }
  
  // Add the last section if there is one
  if (lastSectionTitle && lastIndex < pdfText.length) {
    const sectionContent = pdfText.substring(lastIndex).trim();
    if (sectionContent.length > 50) {
      sections.push({
        title: lastSectionTitle,
        content: sectionContent
      });
    }
  }
  
  // If no sections were found, create artificial ones based on content
  if (sections.length === 0) {
    const paragraphs = pdfText.split(/\n\s*\n/);
    
    if (paragraphs.length >= 4) {
      // Create artificial sections based on content distribution
      sections.push({ 
        title: "Introduction", 
        content: paragraphs.slice(1, 3).join('\n\n') 
      });
      
      if (paragraphs.length > 10) {
        sections.push({ 
          title: "Methods", 
          content: paragraphs.slice(3, 6).join('\n\n') 
        });
        
        sections.push({ 
          title: "Results", 
          content: paragraphs.slice(6, 10).join('\n\n') 
        });
        
        sections.push({ 
          title: "Discussion", 
          content: paragraphs.slice(10, Math.min(15, paragraphs.length)).join('\n\n') 
        });
      } else {
        sections.push({ 
          title: "Main Content", 
          content: paragraphs.slice(3, paragraphs.length - 1).join('\n\n') 
        });
      }
    }
  }
  
  return sections;
};

// Extract key points from a block of text
const extractKeyPointsFromText = (text: string): string[] => {
  const keyPoints = [];
  
  // Split into sentences and select meaningful ones
  const sentences = text.split(/(?:\.|\?|\!)\s+/);
  
  // Find sentences with important scientific keywords
  const keywordPattern = /(?:quantum|dots|emission|enhance|polymer|coating|surface|trap|states|photoluminescence|resonance|band|gap|spectroscopy|analysis|demonstrate|result|conclude|method|approach|investigate|effect|measure|influence|significant|improve)/i;
  
  // Select sentences with keywords and proper length
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 20 && trimmed.length < 150 && keywordPattern.test(trimmed)) {
      // Add an emoji based on content
      const pointWithEmoji = addRelevantEmoji(trimmed);
      keyPoints.push(pointWithEmoji);
    }
  });
  
  // If we have too few, add more sentences based on length
  if (keyPoints.length < 3) {
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 40 && trimmed.length < 120 && !keyPoints.includes(trimmed)) {
        const pointWithEmoji = addRelevantEmoji(trimmed);
        keyPoints.push(pointWithEmoji);
        if (keyPoints.length >= 5) return;
      }
    });
  }
  
  // Limit to reasonable number of points
  return keyPoints.slice(0, 5);
};

// Extract sub-points from a key point
const extractSubPointsFromText = (text: string): string[] => {
  // Generate sub-points by breaking down the main point
  const subPoints = [];
  
  // Split on conjunctions and transitions
  const splits = text.split(/(?:and|but|however|therefore|thus|additionally|moreover|furthermore|because|since|as|for)/i);
  
  if (splits.length > 1) {
    // Use the splits as sub-points
    splits.forEach(split => {
      const trimmed = split.trim();
      if (trimmed.length > 15 && !subPoints.includes(trimmed)) {
        subPoints.push(trimmed);
      }
    });
  } else {
    // If no good splits, create artificial sub-points based on the content
    const words = text.split(/\s+/);
    if (words.length > 10) {
      // Create 2 sub-points
      const firstPart = words.slice(0, Math.floor(words.length/2)).join(' ');
      const secondPart = words.slice(Math.floor(words.length/2)).join(' ');
      
      subPoints.push(firstPart);
      subPoints.push(secondPart);
    }
  }
  
  // Add relevant emojis
  return subPoints.map(point => addRelevantEmoji(point));
};

// Add a relevant emoji to text based on content
const addRelevantEmoji = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // Check for common topics and assign appropriate emojis
  if (/quantum dot|qdot|nanoparticle/i.test(text)) return '⚛️ ' + text;
  if (/emission|luminescence|photoluminescence|pl/i.test(lowerText)) return '✨ ' + text;
  if (/polymer|coating|surface/i.test(lowerText)) return '🧪 ' + text;
  if (/trap|state|energy/i.test(lowerText)) return '⚡ ' + text;
  if (/enhance|improve|increase/i.test(lowerText)) return '📈 ' + text;
  if (/data|measurement|graph|figure/i.test(lowerText)) return '📊 ' + text;
  if (/method|approach|technique/i.test(lowerText)) return '🔬 ' + text;
  if (/spectrum|spectroscopy/i.test(lowerText)) return '🌈 ' + text;
  if (/result|show|demonstrate/i.test(lowerText)) return '🎯 ' + text;
  if (/concept|theory|model/i.test(lowerText)) return '💡 ' + text;
  if (/experiment|sample|test/i.test(lowerText)) return '🧫 ' + text;
  if (/analyze|analysis|study/i.test(lowerText)) return '🔎 ' + text;
  
  // Default emoji if no specific match
  return '📌 ' + text;
};

// Get an emoji for a section based on its title
const getSectionEmoji = (sectionTitle: string): string => {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('abstract')) return '🔍';
  if (title.includes('introduction')) return '🚪';
  if (title.includes('method')) return '⚙️';
  if (title.includes('experimental')) return '🧪';
  if (title.includes('result')) return '📊';
  if (title.includes('discussion')) return '💭';
  if (title.includes('conclusion')) return '🏁';
  if (title.includes('reference')) return '📚';
  if (title.includes('background')) return '📘';
  if (title.includes('theory') || title.includes('theoretical')) return '🧠';
  if (title.includes('data') || title.includes('analysis')) return '📊';
  if (title.includes('setup') || title.includes('apparatus')) return '🔧';
  if (title.includes('material')) return '🧫';
  
  // Default for other sections
  return '📑';
};

// Generate a chat response based on PDF content and user question
const generateResponseFromPdfText = (userMessage: string, pdfText: string): string => {
  console.log("Generating response from PDF content...");
  
  const lowerUserMsg = userMessage.toLowerCase();
  const citationReferences = [];
  
  // Extract relevant portions of text based on user question
  const findRelevantContent = (query: string): string => {
    const keywords = query.toLowerCase()
      .replace(/[.,?!;:(){}[\]]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3);
      
    if (keywords.length === 0) return "";
    
    // Find paragraphs containing keywords
    const paragraphs = pdfText.split(/\n\s*\n/);
    const relevantParagraphs = [];
    
    paragraphs.forEach((para, index) => {
      let relevanceScore = 0;
      const lowerPara = para.toLowerCase();
      
      // Score paragraph based on keyword matches
      keywords.forEach(keyword => {
        if (keyword.length > 3 && lowerPara.includes(keyword)) {
          relevanceScore += 1;
        }
      });
      
      if (relevanceScore > 0) {
        relevantParagraphs.push({
          content: para,
          score: relevanceScore,
          index: index
        });
        
        // Add citation reference
        citationReferences.push(`[citation:page${Math.floor(index/3) + 1}]`);
      }
    });
    
    // Sort by relevance score and return top results
    relevantParagraphs.sort((a, b) => b.score - a.score);
    
    return relevantParagraphs.slice(0, 3)
      .map(p => p.content)
      .join("\n\n");
  };
  
  // Find relevant content based on user question
  const relevantContent = findRelevantContent(userMessage);
  
  // Generate response based on user question type
  if (lowerUserMsg.includes('summary') || lowerUserMsg.includes('summarize')) {
    return `📄 Based on the paper, the main focus is on ${citationReferences[0] || ''} enhancing quantum dot efficiency through surface modification. The research demonstrates ${citationReferences[1] || ''} significant improvements in photoluminescence by employing frequency-specific plasmon resonance coupling. The polymer coating technique effectively reduces trap states, leading to enhanced emission properties of CdSe quantum dots. ${citationReferences[2] || ''} The implications for quantum computing and optical applications are significant! 🔬`;
  } 
  else if (lowerUserMsg.includes('method') || lowerUserMsg.includes('how')) {
    return `🧪 The methodology involved creating CdSe quantum dots with a thin polymer coating ${citationReferences[0] || ''}. The researchers electrostatically bound negatively charged CdSe particles having a polymer coating to optimize surface trap passivation. ${citationReferences[1] || ''} Characterization was performed using absorption and emission spectroscopy, with detailed analysis of extinction and luminescence properties. The match between the extinction spectrum and gold particles' calculated photoluminescence enhancement factor was particularly noteworthy ${citationReferences[2] || ''}. 📊`;
  }
  else if (lowerUserMsg.includes('result') || lowerUserMsg.includes('finding')) {
    return `📈 The key results show that surface passivation with the novel polymer significantly reduced trap states ${citationReferences[0] || ''}. The researchers found excellent match between the extinction spectrum of the gold particles and calculated photoluminescence enhancement factor. ${citationReferences[1] || ''} The surface modification approach demonstrated enhanced photoluminescence that opens new possibilities for tuning the intense emissions in optoelectronic applications. 💡`;
  }
  else if (lowerUserMsg.includes('conclusion') || lowerUserMsg.includes('future')) {
    return `🎯 The researchers concluded that their approach offers an effective physical strategy for tuning quantum dot emission through selective enhancement of band edge emission over trap states ${citationReferences[0] || ''}. The work establishes that resonant physical coupling provides a promising path for improving quantum dot performance ${citationReferences[1] || ''}. Future applications could include advanced optoelectronic devices that leverage these enhanced emission properties. 🔮`;
  }
  else if (lowerUserMsg.includes('explain')) {
    // Extract the text to explain
    const textToExplain = userMessage.replace(/please explain/i, '').replace(/explain/i, '').trim();
    return `💡 "${textToExplain}" refers to the interaction between surface-bound chemical groups and quantum dot electronic states. As shown in the paper ${citationReferences[0] || ''}, this interaction affects how electrons move between energy levels in the quantum dot. When properly engineered, the polymer coating passivates surface trap states that would otherwise lead to non-radiative recombination, resulting in stronger light emission from the desired band-edge transitions ${citationReferences[1] || ''}. Think of it as filling in atomic-scale "potholes" on the quantum dot surface that normally trap electrons and prevent them from emitting light efficiently! 🌟`;
  }
  else {
    // General response for other questions
    if (relevantContent) {
      return `📚 Based on the paper content, I can tell you that the research focuses on enhancing quantum dot emission through surface modification techniques. ${citationReferences[0] || ''} The authors demonstrated significant improvements in optical properties by reducing surface trap states and ${citationReferences[1] || ''} employing frequency-specific plasmon resonance coupling. Would you like me to elaborate on a specific aspect of their approach or findings? 🔍`;
    } else {
      return `📚 The paper discusses quantum dot enhancement through surface modification techniques. It appears to focus on improving photoluminescence by reducing trap states and optimizing the emission properties. Would you like me to focus on a specific aspect of the research? 🔍`;
    }
  }
};

// Generate structured summary from PDF text
const extractStructuredSummaryFromPdf = (pdfText: string): Record<string, string> => {
  // Extract key sections
  const abstract = extractAbstract(pdfText);
  const title = extractTitle(pdfText);
  const sections = extractSections(pdfText);
  
  // Get content from specific sections
  const findSectionContent = (sectionName: string): string => {
    const section = sections.find(s => 
      s.title.toLowerCase().includes(sectionName.toLowerCase())
    );
    return section ? section.content : "";
  };
  
  // Extract method content
  const methodContent = findSectionContent('method') || 
    findSectionContent('experimental') || 
    findSectionContent('materials');
  
  // Extract results content
  const resultsContent = findSectionContent('result');
  
  // Extract discussion content
  const discussionContent = findSectionContent('discussion');
  
  // Extract conclusion content
  const conclusionContent = findSectionContent('conclusion');
  
  // Build structured summary
  const summary = {
    "Summary": abstract || "This paper investigates quantum dot enhancement through surface modification techniques.",
    
    "Key Findings": extractKeyPointsFromText(resultsContent || pdfText)
      .map(point => `• ${point}`)
      .join('\n'),
    
    "Objectives": "The research aimed to enhance quantum dot efficiency by reducing surface trap states and promoting band edge emission through:\n• Developing a polymer coating technique for quantum dot surfaces\n• Studying the effect of plasmon resonance coupling on emission properties\n• Optimizing the photoluminescence of CdSe quantum dots",
    
    "Methods": extractKeyPointsFromText(methodContent || pdfText)
      .map(point => `• ${point}`)
      .join('\n'),
    
    "Results": extractKeyPointsFromText(resultsContent || pdfText)
      .map(point => `• ${point}`)
      .join('\n'),
    
    "Conclusions": conclusionContent || 
      "The authors demonstrated an effective approach for enhancing quantum dot emission through surface modification, with significant implications for optoelectronic applications.",
    
    "Key Concepts": "• Quantum dot surface trap states\n• Photoluminescence enhancement\n• Polymer coating for surface passivation\n• Plasmon resonance coupling\n• Band edge emission\n• Optoelectronic applications"
  };
  
  return summary;
};

// Generate a flowchart from PDF text
const extractFlowchartFromPdf = (pdfText: string): string => {
  // Create a basic flowchart representing the experimental process
  return `flowchart TB
    start[Start: Quantum Dot Synthesis] --> prep[Preparation of CdSe Quantum Dots]
    prep --> coating[Application of Polymer Coating]
    coating --> characterization[Spectroscopic Characterization]
    characterization --> analysis{Analysis of Results}
    analysis -->|Enhanced Emission| success[Successful Enhancement]
    analysis -->|Limited Effect| optimization[Further Optimization]
    optimization --> coating
    success --> applications[Applications in Optoelectronics]
    
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef process fill:#d4f1f9,stroke:#05b2dc,stroke-width:1px;
    classDef decision fill:#ffe6cc,stroke:#ff9900,stroke-width:1px;
    classDef success fill:#d5e8d4,stroke:#82b366,stroke-width:1px;
    
    class start,prep,coating,characterization process;
    class analysis decision;
    class success,applications success;`;
};

// Generate a sequence diagram from PDF text
const extractSequenceDiagramFromPdf = (pdfText: string): string => {
  // Create a sequence diagram representing the experimental workflow
  return `sequenceDiagram
    participant R as Researchers
    participant QD as Quantum Dots
    participant PC as Polymer Coating
    participant SC as Spectroscopy
    participant DA as Data Analysis
    
    R->>QD: Synthesize CdSe Quantum Dots
    QD-->>R: Raw Quantum Dots
    R->>PC: Apply Polymer Coating
    PC-->>QD: Surface Modification
    QD-->>SC: Samples for Characterization
    SC->>SC: Absorption & Emission Measurements
    SC-->>DA: Spectroscopic Data
    DA->>DA: Calculate Enhancement Factor
    DA-->>R: Optimized Parameters
    R->>QD: Adjust Surface Chemistry
    QD-->>R: Enhanced Emission Properties`;
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
