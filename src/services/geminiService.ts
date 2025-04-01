import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Generate mind map data from PDF text
export const generateMindMapFromText = async (text: string) => {
  try {
    // Create a generative model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt for mind map generation
    const prompt = `
      Create a hierarchical mind map structure from the following text. 
      Format the response as a JSON object with the following structure:
      {
        "nodeData": {
          "id": "root",
          "topic": "Main Topic",
          "children": [
            {
              "id": "1",
              "topic": "Subtopic 1",
              "children": [...]
            },
            {
              "id": "2",
              "topic": "Subtopic 2",
              "children": [...]
            }
          ]
        }
      }
      
      Make sure to:
      1. Identify the main topic as the central node
      2. Extract key concepts as first-level nodes
      3. Break down each concept into relevant subtopics
      4. Use clear, concise language for each node
      5. Maintain proper hierarchical relationships
      6. Ensure each node has a unique ID
      7. Keep topics short (under 10 words)
      
      Here's the text to analyze:
      ${text.substring(0, 15000)}
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/```\n([\s\S]*?)\n```/) ||
                      textResponse.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
      return JSON.parse(jsonStr);
    } else {
      try {
        return JSON.parse(textResponse);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid mind map data format received");
      }
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map from text");
  }
};

// Add necessary exports for functions referenced in other components
export const generateStructuredSummary = async (pdfText: string): Promise<string> => {
  try {
    // Create a generative model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt for summary generation
    const prompt = `
      Create a comprehensive, structured summary of the following text.
      Include:
      - Main topic and key points
      - Important details and findings
      - Conclusions or recommendations
      
      Format the summary with clear headings, bullet points, and paragraphs.
      
      Text to summarize:
      ${pdfText.substring(0, 15000)}
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating structured summary:', error);
    throw new Error('Failed to generate summary');
  }
};

export const generateFlowchartFromPdf = async (pdfText: string): Promise<string> => {
  try {
    // Create a generative model instance
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt for flowchart generation
    const prompt = `
      Create a flowchart in Mermaid syntax based on the following text.
      The flowchart should:
      - Represent the main process or decision flow described in the text
      - Use proper Mermaid flowchart syntax (TD direction)
      - Include decision points with yes/no branches where appropriate
      - Keep node text concise and clear
      - Use appropriate shapes for different node types (process, decision, etc.)
      
      Return ONLY the Mermaid code without any explanation or markdown formatting.
      
      Text to analyze:
      ${pdfText.substring(0, 10000)}
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const flowchartCode = response.text().trim();
    
    // Clean up the response to ensure it's valid Mermaid code
    return flowchartCode
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  } catch (error) {
    console.error('Error generating flowchart from PDF:', error);
    throw new Error('Failed to generate flowchart');
  }
};
