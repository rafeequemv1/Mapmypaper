
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Gemini Pro Vision model
const modelVision = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

// Gemini Pro model (text-only)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to get the Gemini Pro model
const getGeminiModel = async () => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
  return model;
};

/**
 * Sends a chat request to Gemini with the given prompt and PDF content.
 * @param prompt The user's question or prompt.
 * @returns The response text from Gemini.
 */
export const chatWithGeminiAboutPdf = async (prompt: string): Promise<string> => {
  try {
    const gemini = await getGeminiModel();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
};

/**
 * Analyzes an image with the Gemini Pro Vision model.
 * @param imageBase64 The base64 encoded image data.
 * @returns The response text from Gemini.
 */
export const analyzeImageWithGemini = async (imageBase64: string): Promise<string> => {
  try {
    if (!imageBase64) {
      throw new Error("Image data is required.");
    }

    const geminiVision = modelVision;
    const result = await geminiVision.generateContent([
      "Analyze the content of this image in detail.",
      imageBase64,
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    throw error;
  }
};

/**
 * Generates a mind map structure from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A JSON structure representing the mind map
 */
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    console.log(`Processing PDF text length: ${pdfText.length} characters`);
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a mind map structure in JSON format.
      Focus on identifying the main topics, key concepts, and their relationships.
      
      Document text excerpt:
      ${truncatedText}
      
      Return ONLY valid JSON without any explanation or formatting.
      The JSON should have this structure:
      {
        "root": {
          "topic": "Main Topic",
          "children": [
            {
              "topic": "Subtopic 1",
              "children": [
                {"topic": "Point 1.1"},
                {"topic": "Point 1.2"}
              ]
            },
            {
              "topic": "Subtopic 2",
              "children": []
            }
          ]
        }
      }
    `;
    
    console.log("Sending request to Gemini API...");
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    console.log("Received response from Gemini API, parsing JSON...");
    
    try {
      // Try to clean the JSON text by removing any markdown formatting
      let cleanedJsonText = jsonText;
      // Remove markdown code block syntax if present
      cleanedJsonText = cleanedJsonText.replace(/```(json)?|```/g, '');
      // Trim whitespace
      cleanedJsonText = cleanedJsonText.trim();
      
      const parsedJson = JSON.parse(cleanedJsonText);
      console.log("Successfully parsed JSON response");
      return parsedJson;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.log("Raw response:", jsonText);
      
      // Return a fallback mind map structure
      return {
        root: {
          topic: "Document Structure",
          children: [
            { topic: "Unable to parse document structure" }
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    throw new Error(`Failed to generate mind map from text: ${error.message}`);
  }
};

/**
 * Generates a structured summary from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A structured summary of the document
 */
export const generateStructuredSummary = async (pdfText: string): Promise<any> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a structured summary.
      Include the following sections:
      - Key Findings
      - Main Arguments
      - Methodology
      - Conclusions
      - Limitations (if mentioned)
      
      Document text excerpt:
      ${truncatedText}
      
      Format the response with markdown headings for each section.
    `;
    
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate structured summary from text: ${error.message}`);
  }
};

/**
 * Generates a mermaid flowchart syntax from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A mermaid flowchart syntax string
 */
export const generateFlowchartFromText = async (pdfText: string): Promise<string> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a mermaid.js flowchart syntax that represents the document's structure. 
      Focus on identifying the main sections, their relationships, and key components. 
      Use the graph TD (top-down) or LR (left-right) format.
      Make the chart concise and readable, limited to the most important 15-20 nodes maximum.
      
      Use proper mermaid.js syntax with node IDs and clear labels.
      Include styling with classDef for important nodes.
      
      Document text excerpt:
      ${truncatedText}
      
      Return ONLY the mermaid syntax without any explanation or markdown code formatting.
    `;
    
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const flowchartSyntax = response.text();
    
    // Remove any markdown code block formatting that might be included
    return flowchartSyntax.replace(/```mermaid|```/g, '').trim();
  } catch (error) {
    console.error("Error generating flowchart from text:", error);
    throw new Error(`Failed to generate flowchart from text: ${error.message}`);
  }
};
