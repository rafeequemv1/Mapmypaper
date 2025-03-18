import { GoogleGenerativeAI } from "@google/generative-ai";

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
    
    Provide a helpful, concise, and accurate response based solely on the document content.
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
    
    return mermaidCode;
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
