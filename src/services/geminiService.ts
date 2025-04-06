
// Update the function to generate content instead of mermaid diagrams
export async function generateVisualizationContent(
  type: "text" | "summary" | "mindmap" | "flowchart", 
  pdfText: string
): Promise<string> {
  try {
    // For mindmap and flowchart, extract key concepts and structure them
    if (type === "mindmap" || type === "flowchart") {
      const concepts = extractConcepts(pdfText);
      return formatStructuredContent(concepts, type);
    } else if (type === "text") {
      return `Generated text content from PDF:
      
${pdfText.substring(0, 500)}...

This is the text extracted from your PDF.`;
    } else if (type === "summary") {
      return generateSummary(pdfText);
    }
    
    throw new Error(`Unsupported visualization type: ${type}`);
  } catch (error) {
    console.error("Error in generateVisualizationContent:", error);
    throw error;
  }
}

// Extract key concepts from PDF text
function extractConcepts(pdfText: string): string[] {
  // Simple extraction of potential key concepts
  const lines = pdfText.split(/\n+/);
  const concepts = [];
  
  // Extract potential titles and important phrases
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and very long paragraphs
    if (trimmedLine.length === 0 || trimmedLine.length > 200) continue;
    
    // Identify potential headings or important points
    if (
      trimmedLine.endsWith('.') || 
      trimmedLine.length < 100 ||
      /^[A-Z][^.!?]*$/.test(trimmedLine) || // Capitalized phrases
      /^[0-9]+\./.test(trimmedLine) || // Numbered points
      /^(Introduction|Method|Results|Discussion|Conclusion|Abstract)/i.test(trimmedLine)
    ) {
      concepts.push(trimmedLine);
    }
  }
  
  // Limit concepts to a reasonable number
  return concepts.slice(0, 25);
}

// Generate summary from PDF text
function generateSummary(pdfText: string): string {
  // Extract first paragraph from each section as a simple summary
  const sections = pdfText.split(/\n\n+/);
  let summary = "Summary of the PDF content:\n\n";
  
  // Get the first paragraph or first 200 chars
  const firstParagraph = sections[0]?.substring(0, 200) + "...";
  summary += firstParagraph + "\n\n";
  
  // Extract what seem like key points
  summary += "Key points:\n";
  
  const keyPointRegex = /(?:^|\n)(?:\d+\.\s*|\*\s*|-\s*|•\s*|[A-Z][^.!?]*:)/g;
  const potentialKeyPoints = pdfText.match(keyPointRegex) || [];
  
  potentialKeyPoints.slice(0, 5).forEach(point => {
    summary += `- ${point.trim()}\n`;
  });
  
  return summary;
}

// Format structured content based on type
function formatStructuredContent(concepts: string[], type: "mindmap" | "flowchart"): string {
  let result = "";
  
  if (type === "mindmap") {
    // Create a simple mind map structure
    const title = concepts[0] || "Document Title";
    result = `Mind Map for: ${title}\n\n`;
    
    // Group concepts into categories
    const categories = categorizeForMindMap(concepts);
    
    // Format as a textual mind map
    Object.entries(categories).forEach(([category, items]) => {
      result += `${category}:\n`;
      items.forEach(item => {
        result += `  - ${item}\n`;
      });
      result += "\n";
    });
  } else if (type === "flowchart") {
    // Create a simple flowchart structure
    result = "Document Process Flow:\n\n";
    
    // Create sequential flow
    result += "Start → ";
    
    // Add concepts as sequential steps
    for (let i = 0; i < Math.min(concepts.length, 10); i++) {
      const concept = concepts[i].length > 30 ? 
        concepts[i].substring(0, 30) + "..." : 
        concepts[i];
      
      result += `${concept} → `;
    }
    
    result += "End";
  }
  
  return result;
}

// Categorize concepts for mind map
function categorizeForMindMap(concepts: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    "Introduction": [],
    "Methods": [],
    "Results": [],
    "Discussion": [],
    "Conclusion": []
  };
  
  // Assign concepts to categories based on simple heuristics
  concepts.forEach(concept => {
    const lowerConcept = concept.toLowerCase();
    
    if (
      lowerConcept.includes("introduction") || 
      lowerConcept.includes("background") ||
      lowerConcept.includes("objective") ||
      lowerConcept.includes("problem")
    ) {
      categories["Introduction"].push(concept);
    } else if (
      lowerConcept.includes("method") || 
      lowerConcept.includes("procedure") ||
      lowerConcept.includes("experiment") ||
      lowerConcept.includes("analysis")
    ) {
      categories["Methods"].push(concept);
    } else if (
      lowerConcept.includes("result") || 
      lowerConcept.includes("finding") ||
      lowerConcept.includes("data") ||
      lowerConcept.includes("figure")
    ) {
      categories["Results"].push(concept);
    } else if (
      lowerConcept.includes("discuss") || 
      lowerConcept.includes("implication") ||
      lowerConcept.includes("limitation")
    ) {
      categories["Discussion"].push(concept);
    } else if (
      lowerConcept.includes("conclusion") || 
      lowerConcept.includes("summary") ||
      lowerConcept.includes("future work")
    ) {
      categories["Conclusion"].push(concept);
    } else {
      // Assign to the category with fewest items
      const smallestCategory = Object.entries(categories)
        .sort(([, a], [, b]) => a.length - b.length)[0][0];
      categories[smallestCategory].push(concept);
    }
  });
  
  return categories;
}

// Add the previously missing functions needed elsewhere in the application
export async function chatWithGeminiAboutPdf(userMessage: string): Promise<string> {
  try {
    // Get PDF content from session storage
    const pdfText = sessionStorage.getItem('pdfText') || '';
    
    // Simple response based on user message
    let response = "Based on the document content:\n\n";
    
    // Extract relevant parts from PDF based on question
    const keywords = userMessage.toLowerCase().split(/\s+/);
    
    // Find paragraphs that might contain answers
    const paragraphs = pdfText.split(/\n\n+/);
    const relevantParagraphs = paragraphs.filter(p => 
      keywords.some(keyword => p.toLowerCase().includes(keyword))
    );
    
    if (relevantParagraphs.length > 0) {
      // Use the most relevant paragraph
      response += relevantParagraphs[0].trim() + "\n\n";
      
      if (relevantParagraphs.length > 1) {
        response += "Additionally: " + relevantParagraphs[1].trim();
      }
    } else {
      response += "I couldn't find specific information about that in the document. Would you like me to summarize the overall content instead?";
    }
    
    return response;
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw new Error("Failed to process your question. Please try again.");
  }
}

export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  try {
    return "Image analysis feature is currently in development. I can see you've shared an image from the PDF, but I don't have the capability to analyze specific images yet. Would you like me to explain the overall content of the document instead?";
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    throw new Error("Failed to analyze the image. Please try again.");
  }
}

export async function generateStructuredSummary(): Promise<Record<string, string>> {
  try {
    const pdfText = sessionStorage.getItem('pdfText') || '';
    const sections = pdfText.split(/\n\n+/);
    
    // Extract title
    const title = sections[0]?.trim() || "Document Title";
    
    // Create a structured summary
    return {
      "Summary": generateSummary(pdfText),
      "Key Findings": extractKeyPoints(pdfText, 4),
      "Objectives": extractObjectives(pdfText),
      "Methods": extractMethodsSection(pdfText),
      "Results": extractResultsSection(pdfText),
      "Conclusions": extractConclusionsSection(pdfText)
    };
  } catch (error) {
    console.error("Error in generateStructuredSummary:", error);
    throw new Error("Failed to generate a structured summary. Please try again.");
  }
}

// Utility functions for structured summary
function extractKeyPoints(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const keyPointCandidates = sentences.filter(s => 
    s.includes("significant") || 
    s.includes("important") || 
    s.includes("finding") ||
    s.includes("result") ||
    s.trim().length < 100
  );
  
  return keyPointCandidates
    .slice(0, count)
    .map(p => `- ${p.trim()}`)
    .join("\n");
}

function extractObjectives(text: string): string {
  const objectiveSection = extractSection(text, ["objective", "aim", "purpose", "goal"]);
  return objectiveSection || "Objectives could not be automatically extracted from this document.";
}

function extractMethodsSection(text: string): string {
  const methodsSection = extractSection(text, ["method", "procedure", "experiment", "materials"]);
  return methodsSection || "Methods section could not be automatically extracted from this document.";
}

function extractResultsSection(text: string): string {
  const resultsSection = extractSection(text, ["result", "finding", "data", "analysis"]);
  return resultsSection || "Results section could not be automatically extracted from this document.";
}

function extractConclusionsSection(text: string): string {
  const conclusionsSection = extractSection(text, ["conclusion", "summary", "discussion"]);
  return conclusionsSection || "Conclusions section could not be automatically extracted from this document.";
}

function extractSection(text: string, keywords: string[]): string {
  const paragraphs = text.split(/\n\n+/);
  
  // Look for paragraphs that might be section headings
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].toLowerCase();
    
    if (keywords.some(keyword => paragraph.includes(keyword))) {
      // Return this paragraph and the next one
      if (i + 1 < paragraphs.length) {
        return paragraphs[i].trim() + "\n\n" + paragraphs[i + 1].trim();
      }
      return paragraphs[i].trim();
    }
  }
  
  return "";
}

export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    const concepts = extractConcepts(text);
    const categories = categorizeForMindMap(concepts);
    
    // Create a mind map structure compatible with mind-elixir
    const mindMapData = {
      nodeData: {
        id: "root",
        topic: concepts[0] || "Paper Title",
        root: true,
        children: []
      }
    };
    
    // Add categories as main branches
    let i = 1;
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length === 0) return;
      
      const categoryNode = {
        id: `${i}`,
        topic: category,
        direction: i <= 3 ? 0 : 1, // Split directions for balance
        children: [] as any[]
      };
      
      // Add items as children
      items.forEach((item, j) => {
        categoryNode.children.push({
          id: `${i}-${j+1}`,
          topic: item.length > 50 ? item.substring(0, 50) + "..." : item
        });
      });
      
      mindMapData.nodeData.children.push(categoryNode);
      i++;
    });
    
    return mindMapData;
  } catch (error) {
    console.error("Error in generateMindMapFromText:", error);
    throw new Error("Failed to generate mind map. Please try again.");
  }
}
