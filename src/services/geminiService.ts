
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
    1. Use only standard Mermaid flowchart TD syntax
    2. Do NOT use hyphens or dashes in node IDs - use alphanumeric characters only
    3. Avoid special characters in node text that might break the parser
    4. For any years or dates, use underscore instead of hyphen (e.g., "2023_2024" not "2023-2024")
    5. Keep node texts very short and concise
    6. Always use letters or alphanumeric strings for node IDs (e.g., A, B, C, process1, etc.)
    7. Wrap all node texts in square brackets
    8. Use only these node shapes: [] for rectangle, () for rounded rectangle, {} for diamond
    9. Maximum 15-20 nodes total for clarity
    
    Example of correct syntax:
    
    flowchart TD
        A[Start] --> B{Decision Point}
        B -->|Yes| C[Process 1]
        B -->|No| D[Process 2]
        C --> E[End Result]
        D --> E
    
    Here's the document text to analyze:
    ${pdfText.slice(0, 10000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove any markdown code blocks and clean up the response
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    // Add basic error checking - if the response is empty, too short, or doesn't start with "flowchart"
    if (!mermaidCode || mermaidCode.length < 20 || !mermaidCode.startsWith("flowchart")) {
      console.error("Invalid flowchart generated:", mermaidCode);
      return `flowchart TD
        A[Start] --> B[No valid flowchart could be generated]
        B --> C[Try with a different document]`;
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};
