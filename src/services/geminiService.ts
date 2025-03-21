import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Store the PDF text in sessionStorage for chat functionality
    sessionStorage.setItem('pdfText', pdfText);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    
    Here's the document text to analyze:
    ${pdfText.slice(0, 15000)}
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
      console.error("Failed to parse Gemini response as JSON:", parseError);
      throw new Error("Failed to generate mind map. The AI response format was invalid.");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

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
    
    // Use a history array to maintain context
    const prompt = `
    You are an AI research assistant chatting with a user about a PDF document. 
    The user has the following question or request: "${message}"
    
    Here's an excerpt from the document they're referring to (it may be truncated):
    ${pdfText.slice(0, 15000)}
    
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
    ${pdfText.slice(0, 15000)}
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
      return `flowchart TD
        A[Error] --> B[No PDF Content]
        B --> C[Please upload a PDF first]`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    ${pdfText.slice(0, 8000)}
    
    Generate ONLY valid Mermaid flowchart code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
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
    ${pdfText.slice(0, 8000)}
    
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
