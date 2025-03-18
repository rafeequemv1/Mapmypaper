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
    Analyze the following academic paper/document text and create a flowchart in Mermaid syntax.
    
    CRITICAL SYNTAX RULES FOR MERMAID FLOWCHART:
    1. Use 'flowchart TD' for top-down flowchart direction
    2. Node definitions MUST follow this syntax: nodeId[Text] or nodeId(Text) or nodeId{Text}
    3. Connections MUST use EXACTLY TWO DASHES and ONE ARROW: A --> B (not A -> B or A ---> B)
    4. Use ONLY alphanumeric characters for node IDs - NO HYPHENS or special characters
    5. Node IDs should be simple like A, B, C, process1, decision1, etc.
    6. All node text content must be enclosed in square brackets [], parentheses (), or curly braces {}
    7. For edge labels use: A -->|Text| B (exactly this format with single pipes)
    8. Do not use hyphens in any node IDs or edge labels
    9. Keep the flowchart simple with max 12 nodes
    10. IMPORTANT: Use exactly 2 dashes in arrows: A --> B (not A -> B or A ---> B)
    11. For subgraphs, use this exact syntax:
       subgraph title
         node1 --> node2
       end
    
    EXAMPLES OF CORRECT SYNTAX:
    \`\`\`
    flowchart TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Process1]
        B -->|No| D[Process2]
        C --> E[End]
        D --> E
        
        subgraph Section1
          F[Step1] --> G[Step2]
        end
        
        E --> F
    \`\`\`
    
    EXAMPLES OF INCORRECT SYNTAX (DO NOT DO THESE):
    - WRONG: A[Start] -> B{Decision}  (use A --> B instead)
    - WRONG: A[Start] ---> B{Decision}  (use A --> B instead)
    - WRONG: node-1 --> node-2  (don't use hyphens in node IDs)
    - WRONG: A Start --> B Decision  (text must be in brackets)
    - WRONG: A--B  (must use the exact syntax A --> B)
    
    Here's the document text to analyze:
    ${pdfText.slice(0, 10000)}
    
    Respond ONLY with valid Mermaid flowchart code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove any markdown code blocks and clean up the response
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    // Clean the generated code
    const cleanedCode = cleanMermaidSyntax(mermaidCode);
    
    return cleanedCode;
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

  // Ensure the code starts with flowchart directive
  let cleaned = code.trim();
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart TD\n" + cleaned;
  }

  // Fix arrow syntax: replace any variations of arrows with proper -->
  cleaned = cleaned
    .replace(/-+>/g, "-->") // Replace any number of dashes with exactly 2
    .replace(/([A-Za-z0-9_]+)[ ]*->[ ]*([A-Za-z0-9_]+)/g, "$1 --> $2"); // Add proper spacing

  // Fix node IDs with hyphens
  cleaned = cleaned.replace(/([A-Za-z0-9]+)-([A-Za-z0-9]+)/g, "$1_$2");

  // Fix missing brackets in node definitions
  // This regex looks for node IDs that aren't followed by [], (), or {}
  cleaned = cleaned.replace(/\b([A-Za-z0-9_]+)(?!\[[^\]]*\]|\([^)]*\)|{[^}]*})(?=\s|$|-->)/g, "$1[?]");

  // Validate lines to ensure they follow Mermaid syntax
  const lines = cleaned.split('\n');
  const validLines = lines.filter(line => {
    // Keep comment lines, empty lines, subgraph lines, and end
    if (line.trim() === '' || line.trim().startsWith('%') || 
        line.trim().startsWith('subgraph') || line.trim() === 'end') {
      return true;
    }
    
    // Keep lines that define connections (A --> B)
    if (line.includes('-->')) {
      return true;
    }
    
    // Keep lines that define nodes (A[Text])
    if (/[A-Za-z0-9_]+\[[^\]]*\]/.test(line) || 
        /[A-Za-z0-9_]+\([^)]*\)/.test(line) || 
        /[A-Za-z0-9_]+{[^}]*}/.test(line)) {
      return true;
    }
    
    // Keep flowchart directive lines
    if (line.startsWith('flowchart')) {
      return true;
    }
    
    // Filter out any lines that don't match the above criteria
    return false;
  });
  
  // If we've filtered out too many lines, use a default flowchart
  if (validLines.length < 3 && !validLines.some(line => line.includes('-->'))) {
    return `flowchart TD
      A[Error] --> B[Invalid Syntax]
      B --> C[Could not generate valid flowchart]`;
  }
  
  return validLines.join('\n');
};
