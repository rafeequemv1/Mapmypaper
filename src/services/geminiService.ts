
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
    
    STRICT MERMAID FLOWCHART SYNTAX RULES - FOLLOW EXACTLY:
    1. Start with 'flowchart TD' for top-down direction
    2. Node definition MUST follow these formats exactly:
       - nodeId[Text in rectangular box]
       - nodeId(Text in rounded box)
       - nodeId((Text in circle))
       - nodeId>Text in flag]
       - nodeId{Text in diamond}
       - nodeId{{Text in hexagon}}
       - nodeId[(Text in database)]
       - nodeId[[Text in subroutine]]
    3. Node IDs MUST be simple and alphanumeric - NO SPECIAL CHARACTERS OR SPACES
       - Good examples: A, B, node1, process2
       - BAD examples: node-1, 2023-2024, node.1, "nodeA"
    4. Connections MUST use the long arrow syntax:
       - A --> B  (NOT A->B)
       - A --o B  (open circle arrow)
       - A --x B  (x on the end)
    5. For edge labels use pipe syntax:
       - A -->|Label text| B
    6. For subgraphs use:
       - subgraph title
         node1 --> node2
       - end
    7. NEVER use HTML tags in node text
    8. NEVER use dates with hyphens like 2023-2024 (use 2023to2024 instead)
    9. Keep the flowchart to maximum 15 nodes for clarity
    10. Ensure ALL text content is properly enclosed in appropriate brackets
    
    EXAMPLE OF CORRECT SYNTAX:
    
    flowchart TD
        Start[Begin Process] --> Decision{Is data valid?}
        Decision -->|Yes| Process1[Process the data]
        Decision -->|No| Error[Show error message]
        Process1 --> DB[(Store in database)]
        Error --> End[End process]
        DB --> End
    
    Here's the document to analyze. Create a VALID flowchart that represents its key processes or concepts:
    ${pdfText.slice(0, 10000)}
    
    IMPORTANT: Double check your syntax before responding. Every node must have proper ID and text format. Every connection must use the proper arrow syntax (-->). Do not use any special characters or hyphens in node IDs.
    
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
    
    // Final validation and cleanup
    let cleanedCode = mermaidCode;
    
    // Ensure it starts with flowchart directive
    if (!cleanedCode.startsWith("flowchart")) {
      cleanedCode = `flowchart TD\n${cleanedCode}`;
    }
    
    // Fix common syntax errors
    cleanedCode = cleanedCode
      // Fix arrows
      .replace(/->/g, "-->")
      // Fix node IDs with hyphens
      .replace(/(\w+)-(\w+)(\[|\(|\{|\[\(|\{\{|\>\[)/g, "$1_$2$3")
      // Fix dates with hyphens
      .replace(/(\d{4})-(\d{4})/g, "$1_$2");
    
    return cleanedCode;
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};
