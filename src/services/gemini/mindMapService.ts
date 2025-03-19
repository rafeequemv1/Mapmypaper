
import { initGeminiClient, parseJsonResponse, storePdfText, truncatePdfText } from "./baseService";

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Store the PDF text in sessionStorage for chat functionality
    storePdfText(pdfText);
    
    const model = initGeminiClient();

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
    ${truncatePdfText(pdfText)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsedData = parseJsonResponse(text);
    
    // Ensure proper object structure for the mind map
    if (!parsedData || typeof parsedData !== 'object' || !parsedData.nodeData) {
      console.error("Invalid mind map data structure:", parsedData);
      // Return a fallback structure
      return createFallbackMindMap("Invalid Response Format");
    }
    
    // Additional validation to ensure the structure matches what mind-elixir expects
    try {
      validateMindMapStructure(parsedData.nodeData);
      return parsedData;
    } catch (structureError) {
      console.error("Mind map structure validation error:", structureError);
      return createFallbackMindMap("Data Structure Error");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return createFallbackMindMap("API Error");
  }
};

// Validate the mind map structure recursively
const validateMindMapStructure = (node: any) => {
  if (!node || typeof node !== 'object') {
    throw new Error("Node is not an object");
  }
  
  if (!node.id || typeof node.id !== 'string') {
    throw new Error("Node id is missing or not a string");
  }
  
  if (!node.topic || typeof node.topic !== 'string') {
    throw new Error("Node topic is missing or not a string");
  }
  
  // Ensure children is an array if present
  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) {
      throw new Error("Node children is not an array");
    }
    
    // Validate each child
    node.children.forEach((child: any) => validateMindMapStructure(child));
  } else {
    // Ensure children is at least an empty array
    node.children = [];
  }
  
  return true;
};

// Create a fallback mind map structure when there's an error
const createFallbackMindMap = (errorType: string) => {
  return {
    nodeData: {
      id: 'root',
      topic: 'Document Analysis',
      children: [
        {
          id: 'error',
          topic: `Error: ${errorType}`,
          direction: 0,
          children: [
            {
              id: 'error-1',
              topic: 'Please try again or upload a different document',
              children: []
            }
          ]
        },
        {
          id: 'suggestion',
          topic: 'Suggestions',
          direction: 1,
          children: [
            {
              id: 'suggestion-1',
              topic: 'Check document format',
              children: []
            },
            {
              id: 'suggestion-2',
              topic: 'Try with a shorter document',
              children: []
            }
          ]
        }
      ]
    }
  };
};
