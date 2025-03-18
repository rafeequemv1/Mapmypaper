
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
    
    return parseJsonResponse(text);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};
