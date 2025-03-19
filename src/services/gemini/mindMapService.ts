
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
    if (typeof parsedData === 'string' || !parsedData.nodeData) {
      console.error("Invalid mind map data structure:", parsedData);
      // Return a fallback structure
      return {
        nodeData: {
          id: 'root',
          topic: 'Document Analysis',
          children: [
            {
              id: 'error',
              topic: 'Error analyzing document',
              direction: 0,
              children: []
            }
          ]
        }
      };
    }
    
    return parsedData;
  } catch (error) {
    console.error("Gemini API error:", error);
    // Return a fallback structure in case of error
    return {
      nodeData: {
        id: 'root',
        topic: 'Error Processing Document',
        children: [
          {
            id: 'error',
            topic: 'Could not analyze document content',
            direction: 0,
            children: []
          }
        ]
      }
    };
  }
};
