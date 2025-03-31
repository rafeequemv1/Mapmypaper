
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    if (!pdfText || pdfText.trim() === '') {
      console.error("No PDF text provided to generateMindMapFromText");
      throw new Error("No PDF text content available. Please upload a PDF first.");
    }
    
    console.log(`Generating mindmap from PDF text (length: ${pdfText.length})`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // For very large documents, ensure we're using the appropriate model 
    // with higher context window
    if (pdfText.length > 100000) {
      console.log("Using high-capacity model for large document");
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are an expert at analyzing academic papers and creating structured mind maps from them. Focus on the key concepts, relationships, and hierarchy." 
      });
    }

    // For larger documents, we'll extract key sections for better analysis
    const processedText = processLargeDocument(pdfText);
    console.log(`Processed text for Gemini analysis (length: ${processedText.length})`);
    
    const prompt = `
    Analyze the following academic paper/document text and create a hierarchical mind map structure.
    Format the response as a JSON object with the following structure:
    {
      "nodeData": {
        "id": "root",
        "topic": "Main Title of the Paper",
        "children": [
          {
            "id": "section1",
            "topic": "Section Title",
            "direction": 0,
            "children": [
              {"id": "section1-1", "topic": "Subsection or Key Point"},
              {"id": "section1-2", "topic": "Another Key Point"}
            ]
          },
          {
            "id": "section2",
            "topic": "Another Main Section",
            "direction": 1,
            "children": []
          }
        ]
      }
    }

    Use "direction": 0 for nodes on the left side, and "direction": 1 for nodes on the right side.
    Make sure to keep the structure clean and organized.
    Only include the JSON in your response, nothing else.
    
    For large texts, focus on extracting the most important concepts only and create a concise mind map.
    
    Here's the document text to analyze:
    ${processedText}
    `;

    console.log("Sending request to Gemini API for mindmap generation");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received response from Gemini API");
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      
      console.log("Attempting to parse JSON response, first 100 chars:", jsonString.substring(0, 100));
      const mindMapData = JSON.parse(jsonString);
      
      // Validate the structure contains nodeData
      if (!mindMapData.nodeData) {
        console.error("Invalid mindmap structure - missing nodeData:", mindMapData);
        // Attempt to fix common structure issues
        if (mindMapData.id && mindMapData.topic) {
          console.log("Attempting to fix missing nodeData structure");
          const fixedData = { nodeData: mindMapData };
          console.log("Fixed mind map structure:", fixedData);
          sessionStorage.setItem('mindMapData', JSON.stringify(fixedData));
          return fixedData;
        }
        throw new Error("Generated mindmap has invalid structure");
      }
      
      console.log("Successfully parsed JSON response, storing in sessionStorage");
      // Store the mindmap data in sessionStorage
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      
      return mindMapData;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Raw response text:", text.substring(0, 500) + "...");
      
      // Attempt recovery - create a basic mindmap structure
      try {
        console.log("Attempting to create fallback mindmap from text");
        const fallbackMindMap = createFallbackMindMap(processedText);
        sessionStorage.setItem('mindMapData', JSON.stringify(fallbackMindMap));
        return fallbackMindMap;
      } catch (fallbackError) {
        console.error("Failed to create fallback mindmap:", fallbackError);
        throw new Error("Failed to generate mind map. The AI response format was invalid.");
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// Create a basic fallback mindmap from text when automatic generation fails
const createFallbackMindMap = (text: string): any => {
  // Extract title (first non-empty line or default)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const title = lines.length > 0 ? lines[0].trim() : "Document Analysis";
  
  // Find potential section headings (capitalized lines or lines ending with colon)
  const potentialHeadings = lines.filter(line => {
    const trimmed = line.trim();
    return (
      (trimmed.length > 0 && trimmed.length < 100) &&
      ((/^[A-Z]/.test(trimmed) && /[.:]$/.test(trimmed)) || 
       (/^[0-9]+\./.test(trimmed)) || 
       (/^[A-Z][A-Z\s]{2,}/.test(trimmed)))
    );
  }).slice(0, 8); // Limit to first 8 potential headings
  
  // Create a basic mindmap structure
  const mindMap = {
    nodeData: {
      id: "root",
      topic: title.length > 50 ? title.substring(0, 50) + "..." : title,
      children: []
    }
  };
  
  // Add children nodes alternating directions
  potentialHeadings.forEach((heading, index) => {
    const direction = index % 2 === 0 ? 0 : 1;
    const cleanHeading = heading.replace(/^[0-9]+\.\s*/, '').trim();
    const topicText = cleanHeading.length > 40 ? cleanHeading.substring(0, 40) + "..." : cleanHeading;
    
    mindMap.nodeData.children.push({
      id: `section${index + 1}`,
      topic: topicText,
      direction,
      children: []
    });
  });
  
  // If we couldn't find any headings, add some default nodes
  if (mindMap.nodeData.children.length === 0) {
    mindMap.nodeData.children = [
      { id: "section1", topic: "Key Points", direction: 0, children: [] },
      { id: "section2", topic: "Main Ideas", direction: 1, children: [] }
    ];
  }
  
  return mindMap;
};

// Helper function to process large documents for optimal analysis
function processLargeDocument(text: string): string {
  // For extremely large documents, we need an even more aggressive approach
  if (text.length > 200000) {
    console.log("Document is extremely large, using highly optimized processing");
    
    // Extract potential section headers using regex patterns for academic papers
    const headingPatterns = [
      /\n([A-Z][A-Za-z\s]{3,50})\n/g,                   // Capitalized lines
      /\n([0-9]+\.\s[A-Z][A-Za-z\s]{3,50})\n/g,         // Numbered sections
      /\n(INTRODUCTION|ABSTRACT|CONCLUSION|METHODS|RESULTS|DISCUSSION|REFERENCES)\s*\n/gi // Common section names
    ];
    
    const potentialHeadings: string[] = [];
    const headingPositions: number[] = [];
    
    // Find potential headings using different patterns
    for (const pattern of headingPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        potentialHeadings.push(match[1]);
        headingPositions.push(match.index);
      }
    }
    
    // Sort headings by their position in the text
    const sortedHeadings = potentialHeadings
      .map((heading, i) => ({ heading, position: headingPositions[i] }))
      .sort((a, b) => a.position - b.position);
    
    // Large sample from beginning (usually has abstract, intro etc.)
    const beginning = text.slice(0, 20000); 
    
    // Construct a representative sample based on key sections
    let sampleText = beginning + "\n\n";
    
    // Add content from important section types if we can find them
    const keySectionPatterns = [
      /(abstract|summary)/i,
      /(introduction|background)/i,
      /(method|approach|model)/i,
      /(result|finding|observation)/i,
      /(discussion|analysis)/i,
      /(conclusion|future work)/i
    ];
    
    // For each key section pattern, try to find a matching section
    for (const pattern of keySectionPatterns) {
      for (let i = 0; i < sortedHeadings.length; i++) {
        const { heading, position } = sortedHeadings[i];
        if (pattern.test(heading)) {
          // Found a key section, extract some text from it
          const sectionStart = position;
          const sectionEnd = (i < sortedHeadings.length - 1) 
            ? sortedHeadings[i + 1].position 
            : Math.min(position + 15000, text.length);
          
          const sectionText = text.slice(sectionStart, sectionEnd);
          if (sectionText.length > 500) { // Only add substantial sections
            sampleText += `\n\n${heading}:\n${sectionText}\n\n`;
          }
        }
      }
    }
    
    // If we didn't find enough key sections, add some samples
    if (sampleText.length < 50000) {
      const numSamples = 4;
      for (let i = 1; i <= numSamples; i++) {
        const startPos = Math.floor((text.length / (numSamples + 1)) * i);
        sampleText += text.slice(startPos, startPos + 10000) + "\n\n[...]\n\n";
      }
    }
    
    // Add conclusion (often at the end)
    const conclusion = text.slice(Math.max(0, text.length - 15000));
    sampleText += conclusion;
    
    return sampleText;
  }
  
  // For very large documents
  if (text.length > 100000) {
    console.log("Document is very large, using advanced processing");
    
    // Take beginning (usually abstract/introduction)
    const beginning = text.slice(0, 15000);
    
    // Take samples from throughout the document at regular intervals
    const samples = [];
    const numSamples = 5;
    const textLength = text.length;
    
    for (let i = 1; i <= numSamples; i++) {
      const startPos = Math.floor((textLength / (numSamples + 1)) * i);
      samples.push(text.slice(startPos, startPos + 10000));
    }
    
    // Take end (usually conclusion, references)
    const end = text.slice(Math.max(0, text.length - 15000));
    
    // Combine all parts
    return beginning + samples.join("\n\n[...]\n\n") + "\n\n[...]\n\n" + end;
  }
  
  // For medium-sized documents
  if (text.length > 30000) {
    console.log("Document is medium-sized, using simplified processing");
    // Take beginning (abstract/intro), some middle content, and end (conclusion)
    const beginning = text.slice(0, 10000);
    const middle = text.slice(Math.floor(text.length / 2) - 5000, Math.floor(text.length / 2) + 5000);
    const end = text.slice(text.length - 10000);
    
    return beginning + "\n\n[...]\n\n" + middle + "\n\n[...]\n\n" + end;
  }
  
  // For smaller documents, use the text as is
  return text;
}

// New function to chat with Gemini about PDF content
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return "I don't have access to the PDF content. Please make sure you've uploaded a PDF first.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process text to get a representative sample if it's too large
    const processedText = pdfText.length > 30000 ? processLargeDocument(pdfText) : pdfText.slice(0, 15000);
    
    // Use a history array to maintain context
    const prompt = `
    You are an AI research assistant chatting with a user about a PDF document. 
    The user has the following question or request: "${message}"
    
    Here's an excerpt from the document they're referring to (it may be truncated):
    ${processedText}
    
    Provide a helpful, well-structured response based solely on the document content.
    Structure your answer with:
    - Clear headings using markdown (# for main headings, ## for subheadings)
    - Bullet points (using * or -) for lists
    - Numbered lists (1., 2., etc.) for sequential items
    - Use **bold** for emphasis on important points
    - Organize information logically with appropriate paragraph breaks
    
    If you can't answer based on the provided text, be honest about your limitations.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};

// New function to analyze images with Gemini vision capabilities
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage for context
    const pdfText = sessionStorage.getItem('pdfText');
    const pdfContext = pdfText ? pdfText.slice(0, 5000) : "";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process image data to ensure proper format
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Image = imageData.split(',')[1] || imageData;
    
    // Create the content parts including the image
    // Fixed version that matches the GenerativeAI library's expected types
    const prompt = `
      You are an AI research assistant helping a user understand content from an academic PDF. 
      The user has shared a snapshot from the PDF document. 
      Analyze the image and provide a detailed explanation of what's shown.
      If there are figures, charts, tables, equations, or diagrams, describe them thoroughly.
      If there is text content, summarize the key points and explain any technical concepts.
      Make connections to the broader context of the document if possible.
      
      Here's some context from the document (it may be truncated):
      ${pdfContext}
    `;
    
    // Create properly formatted content parts
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Image
      }
    };
    
    // Generate content with the image - fixed structure
    const result = await model.generateContent([
      prompt,
      imagePart
    ]);
    
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API vision error:", error);
    return "Sorry, I encountered an error while analyzing the image. Please try again.";
  }
};

// New function to generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process text for larger documents
    const processedText = processLargeDocument(pdfText);
    
    const prompt = `
    Analyze this academic document and create a structured summary with the following sections:
    
    1. Overview: A brief snapshot of the entire document (2-3 sentences)
    2. Key Findings: The main discoveries or conclusions (3-5 bullet points)
    3. Objectives: The stated goals of the research (2-3 bullet points)
    4. Methods: How the research was conducted (2-4 bullet points)
    5. Results: Significant outcomes and data (3-5 bullet points)
    6. Conclusions: Final interpretations and implications (2-3 bullet points)
    
    Format your response as a JSON object with these section names as keys and the content as values.
    Keep each section concise and focused on the most important information.
    If the document doesn't contain information for a specific section, provide a brief note explaining this.
    
    Document text:
    ${processedText}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini summary response as JSON:", parseError);
      throw new Error("Failed to generate summary. The AI response format was invalid.");
    }
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    throw error;
  }
};

// New function to generate flowchart from PDF content
export const generateFlowchartFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      console.error("No PDF text available for flowchart generation");
      return `flowchart TD
        A[Error] --> B[No PDF Content]
        B --> C[Please upload a PDF first]`;
    }
    
    console.log(`Generating flowchart from PDF text (length: ${pdfText.length})`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process text for larger documents
    const processedText = processLargeDocument(pdfText);
    
    const prompt = `
    Create a simple, valid Mermaid flowchart based on this document text.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'flowchart TD'
    2. Nodes MUST have this format: A[Text] or A(Text) or A{Text} - no exceptions
    3. Node IDs MUST be simple alphanumeric: A, B, C1, process1 (NO special chars or hyphens)
    4. Connections MUST use EXACTLY TWO dashes: A --> B (not A->B or A---->B)
    5. Each line should define ONE connection or ONE node
    6. Max 12 nodes total
    7. For labels on arrows: A -->|Label text| B (use single pipes)
    8. Never use semicolons (;) in node text or connections
    9. EXTREMELY IMPORTANT: Never use hyphens (-) in node text. Replace ALL hyphens with spaces or underscores.
    10. IMPORTANT: Date ranges like 1871-2020 must be written as 1871_2020 in node text.
    11. IMPORTANT: Simple node text is best - keep it short, avoid special characters
    
    EXAMPLE CORRECT SYNTAX:
    flowchart TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Process One]
      B -->|No| D[Process Two]
      C --> E[End]
      D --> E
    
    Here's the document text:
    ${processedText}
    
    Generate ONLY valid Mermaid flowchart code, nothing else.
    `;
    
    console.log("Sending request to Gemini API for flowchart generation");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    console.log("Received response from Gemini API for flowchart");
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanMermaidSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `flowchart TD
      A[Error] --> B[Empty flowchart]
      B --> C[Please try again]`;
  }

  try {
    // Ensure the code starts with flowchart directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart TD\n" + cleaned;
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n');
    const validLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and keep comments
      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        validLines.push(line);
        return;
      }
      
      // Keep flowchart directive
      if (trimmedLine.startsWith('flowchart') || 
          trimmedLine.startsWith('subgraph') || 
          trimmedLine === 'end') {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax: ensure exactly two dashes
      let fixedLine = line;
      
      // Replace arrows with more or fewer than 2 dashes
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*([A-Za-z0-9_]+)/g, "$1 --> $2");
      
      // Fix arrows with labels too
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*\|([^|]*)\|\s*([A-Za-z0-9_]+)/g, "$1 -->|$2| $3");
      
      // Fix node IDs with hyphens by replacing with underscores
      fixedLine = fixedLine.replace(/\b([A-Za-z0-9]+)-([A-Za-z0-9]+)\b(?!\]|\)|\})/g, "$1_$2");
      
      // Fix date ranges in node text by replacing hyphens with underscores
      // Look for patterns like [text (1871-2020) text] and replace with [text (1871_2020) text]
      fixedLine = fixedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
      fixedLine = fixedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
      fixedLine = fixedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
      
      // Replace all remaining hyphens inside node text with spaces or underscores
      // Handle square brackets []
      fixedLine = fixedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle parentheses ()
      fixedLine = fixedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle curly braces {}
      fixedLine = fixedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
      
      // Fix nodes without brackets by adding them
      const nodeDefinitionRegex = /^([A-Za-z0-9_]+)\s+\[([^\]]+)\]/;
      const nodeWithoutBrackets = /^([A-Za-z0-9_]+)(\s+)(?!\[|\(|\{)(.*?)(\s*-->|\s*$)/;
      
      if (nodeWithoutBrackets.test(fixedLine)) {
        fixedLine = fixedLine.replace(nodeWithoutBrackets, "$1$2[$3]$4");
      }
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    // Validate: ensure there's at least one connection (arrow)
    const hasConnections = validLines.some(line => line.includes('-->'));
    
    if (!hasConnections) {
      console.warn("No connections found in flowchart, adding default connection");
      validLines.push("A[Start] --> B[End]");
    }
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning Mermaid syntax:", error);
    return `flowchart TD
      A[Error] --> B[Syntax Cleaning Failed]
      B --> C[Please try again]`;
  }
};

// New function to generate sequence diagram from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `sequenceDiagram
        participant Error
        participant User
        
        Error->>User: No PDF Content
        User->>Error: Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process text for larger documents
    const processedText = processLargeDocument(pdfText);
    
    const prompt = `
    Create a valid Mermaid sequence diagram based on this research document text. 
    The sequence diagram should visualize the methodology, experimental procedures, or workflow described in the document.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'sequenceDiagram'
    2. Participants defined with 'participant Name'
    3. Messages between participants use: ParticipantA->>ParticipantB: Message text 
    4. For activation/deactivation use: activate/deactivate ParticipantName
    5. For notes: Note right/left of ParticipantName: Note text
    6. Keep it simple with max 6-8 participants
    7. Focus on the key steps in the research methodology or experimental process
    8. Don't use any special characters that might break the syntax
    
    EXAMPLE CORRECT SYNTAX:
    sequenceDiagram
      participant Researcher
      participant Sample
      participant Instrument
      
      Researcher->>Sample: Prepare
      activate Sample
      Sample->>Instrument: Analyze
      Instrument->>Researcher: Return results
      deactivate Sample
      Note right of Researcher: Analyze data
    
    Here's the document text:
    ${processedText}
    
    Generate ONLY valid Mermaid sequence diagram code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanSequenceDiagramSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Failed to generate diagram
      System->>Error: Please try again`;
  }
};

// Helper function to clean and fix common sequence diagram syntax issues
const cleanSequenceDiagramSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Empty diagram
      System->>Error: Please try again`;
  }

  try {
    // Ensure the code starts with sequenceDiagram directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("sequenceDiagram")) {
      cleaned = "sequenceDiagram\n" + cleaned;
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n');
    const validLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and keep comments
      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        validLines.push(line);
        return;
      }
      
      // Keep sequenceDiagram directive
      if (trimmedLine.startsWith('sequenceDiagram')) {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax if needed
      let fixedLine = line;
      
      // Fix arrows with two dashes only
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)/g, "$1->>$2");
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning sequence diagram syntax:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Syntax Cleaning Failed
      System->>Error: Please try again`;
  }
};
