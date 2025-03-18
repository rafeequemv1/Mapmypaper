
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
    
    IMPORTANT INSTRUCTIONS FOR MERMAID FLOWCHART:
    1. Use 'flowchart TD' for top-down flowchart direction
    2. Follow EXACTLY this syntax for node definition: nodeId[Text] or nodeId(Text) or nodeId{Text}
    3. Follow EXACTLY this syntax for edges: nodeId1 --> nodeId2
    4. Use alphanumeric characters ONLY for node IDs - NO HYPHENS or special characters
    5. Node IDs should be simple like A, B, C, process1, decision1, etc.
    6. All text content must be enclosed in square brackets [], parentheses (), or curly braces {}
    7. For edge labels, use: nodeId1 -->|Text| nodeId2
    8. Avoid dates with hyphens like "2023-2024" - use "2023_2024" instead
    9. Keep the flowchart simple with max 15 nodes
    10. Check every line to ensure it matches proper Mermaid syntax
    
    CORRECT SYNTAX EXAMPLES:
    flowchart TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Process1]
        B -->|No| D[Process2]
        C --> E[End]
        D --> E
    
    INCORRECT SYNTAX EXAMPLES (DO NOT DO THESE):
    - Using hyphens in node IDs: node-1 --> node-2
    - Missing brackets for text: A Start --> B Decision
    - Using dates with hyphens: A[2023-2024 Report]
    
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
    
    // Validate syntax - basic checks for common issues
    const validationChecks = [
      { test: /flowchart (TD|LR|RL|BT)/i, error: "Missing or invalid flowchart directive" },
      { test: /->/g, error: "Invalid arrow syntax (-> instead of -->)" },
      { test: /\w+-\w+/g, error: "Node IDs contain hyphens" },
      { test: /\d{4}-\d{4}/g, error: "Year ranges contain hyphens" },
    ];
    
    for (const check of validationChecks) {
      if (check.test.test(mermaidCode) && check.error.includes("Invalid arrow")) {
        return mermaidCode.replace(/->/g, "-->");
      }
      
      if (check.test.test(mermaidCode) && check.error.includes("Node IDs contain hyphens")) {
        return `flowchart TD
          A[Error] --> B[Invalid Syntax]
          B --> C[Node IDs should not contain hyphens]`;
      }
      
      if (check.test.test(mermaidCode) && check.error.includes("Year ranges contain hyphens")) {
        return mermaidCode.replace(/(\d{4})-(\d{4})/g, "$1_$2");
      }
    }
    
    if (!mermaidCode.startsWith("flowchart")) {
      return `flowchart TD
        A[Error] --> B[Invalid Syntax]
        B --> C[Flowchart directive missing]`;
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};
