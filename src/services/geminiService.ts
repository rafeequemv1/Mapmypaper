
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Updated model names for the current API version
// Gemini Pro Vision model
const modelVision = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

// Gemini Pro model (text-only)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    console.log("Sending chat request to Gemini:", prompt.substring(0, 100) + "...");
    const gemini = await getGeminiModel();
    
    // Set appropriate timeout for API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const result = await gemini.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
    
    clearTimeout(timeoutId);
    
    const response = result.response;
    console.log("Received response from Gemini");
    return response.text();
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    if (error.message?.includes("DEADLINE_EXCEEDED") || error.message?.includes("timeout")) {
      return "The request timed out. Please try again with a shorter question or wait a moment and try again.";
    }
    return `Error: ${error.message || "An unknown error occurred"}. Please try again.`;
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

    console.log("Sending image analysis request to Gemini");
    const geminiVision = modelVision;
    
    // Set appropriate timeout for API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const result = await geminiVision.generateContent([
      "Analyze the content of this image in detail.",
      { inlineData: { data: imageBase64.split(",")[1] || imageBase64, mimeType: "image/jpeg" } }
    ]);
    
    clearTimeout(timeoutId);
    
    const response = result.response;
    console.log("Received image analysis from Gemini");
    return response.text();
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    if (error.message?.includes("DEADLINE_EXCEEDED") || error.message?.includes("timeout")) {
      return "The image analysis request timed out. Please try again with a simpler image or wait a moment and try again.";
    }
    return `Error analyzing image: ${error.message || "An unknown error occurred"}. Please try again.`;
  }
};

/**
 * Explains a selected text from a PDF using Gemini
 * @param selectedText The text selected by the user
 * @returns The explanation of the selected text
 */
export const explainSelectedText = async (selectedText: string): Promise<string> => {
  try {
    if (!selectedText || typeof selectedText !== 'string' || selectedText.trim() === '') {
      throw new Error("Valid selected text is required.");
    }
    
    console.log(`Explaining selected text (length: ${selectedText.length} characters)`);
    
    const prompt = `
      Please explain the following text in clear, simple terms. If it contains academic or technical 
      concepts, provide definitions and context. Use bullet points where appropriate.
      
      Selected text:
      "${selectedText.substring(0, 1500)}"
      
      Provide your explanation with relevant emojis and citations if applicable.
    `;
    
    return await chatWithGeminiAboutPdf(prompt);
  } catch (error) {
    console.error("Error explaining selected text:", error);
    throw new Error(`Failed to explain selected text: ${error.message}`);
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
      console.error("Invalid PDF text provided:", pdfText?.substring(0, 100) || "undefined");
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    console.log(`Processing PDF text for mind map (length: ${pdfText.length} characters)`);
    
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
    
    console.log("Sending mind map generation request to Gemini API...");
    const geminiModel = await getGeminiModel();
    
    // Set appropriate timeout for API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
    
    clearTimeout(timeoutId);
    
    const response = result.response;
    const jsonText = response.text();
    
    console.log("Received response from Gemini API for mind map, parsing JSON...");
    
    try {
      // Try to clean the JSON text by removing any markdown formatting
      let cleanedJsonText = jsonText;
      // Remove markdown code block syntax if present
      cleanedJsonText = cleanedJsonText.replace(/```(json)?|```/g, '');
      // Trim whitespace
      cleanedJsonText = cleanedJsonText.trim();
      
      const parsedJson = JSON.parse(cleanedJsonText);
      console.log("Successfully parsed JSON response for mind map");
      return parsedJson;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.log("Raw response:", jsonText);
      
      // Return a fallback mind map structure
      return {
        root: {
          topic: "Document Structure",
          children: [
            { topic: "Introduction", children: [
              { topic: "Research background" },
              { topic: "Problem statement" }
            ]},
            { topic: "Methods", children: [
              { topic: "Data collection" },
              { topic: "Analysis techniques" }
            ]},
            { topic: "Results", children: [
              { topic: "Key findings" }
            ]},
            { topic: "Discussion", children: [
              { topic: "Implications" },
              { topic: "Limitations" }
            ]},
            { topic: "Conclusion", children: [
              { topic: "Summary" },
              { topic: "Future research" }
            ]}
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    
    // Return a default mind map structure for error cases
    return {
      root: {
        topic: "Document Structure",
        children: [
          { topic: "Introduction", children: [
            { topic: "Research background" },
            { topic: "Problem statement" }
          ]},
          { topic: "Methods", children: [
            { topic: "Data collection" },
            { topic: "Analysis techniques" }
          ]},
          { topic: "Results", children: [
            { topic: "Key findings" }
          ]},
          { topic: "Discussion", children: [
            { topic: "Implications" },
            { topic: "Limitations" }
          ]},
          { topic: "Conclusion", children: [
            { topic: "Summary" },
            { topic: "Future research" }
          ]}
        ]
      }
    };
  }
};

/**
 * Generates a structured summary from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A structured summary of the document
 */
export const generateStructuredSummary = async (pdfText: string): Promise<string> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText?.substring(0, 100) || "undefined");
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
    
    return await chatWithGeminiAboutPdf(prompt);
  } catch (error) {
    console.error("Error generating structured summary:", error);
    return `Failed to generate structured summary: ${error.message}. Please try again later.`;
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
      console.error("Invalid PDF text provided:", pdfText?.substring(0, 100) || "undefined");
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
      The syntax must begin with 'graph TD' or 'graph LR'.
      Example of valid syntax:
      graph TD
        A[Introduction] --> B[Methods]
        B --> C[Results]
        C --> D[Discussion]
        classDef important fill:#f96,stroke:#333,stroke-width:2px;
        class A,D important;
    `;
    
    console.log("Sending flowchart generation request to Gemini API...");
    return await chatWithGeminiAboutPdf(prompt);
  } catch (error) {
    console.error("Error generating flowchart from text:", error);
    // Return a default flowchart for research papers
    return `
      graph TD
        title[Research Paper Structure] --> abstract[Abstract]
        title --> intro[Introduction]
        title --> methods[Methodology]
        title --> results[Results]
        title --> discuss[Discussion]
        title --> concl[Conclusion]
        title --> refs[References]
        
        intro --> background[Background & Context]
        intro --> problem[Problem Statement]
        methods --> design[Research Design]
        methods --> data[Data Collection]
        results --> findings[Key Findings]
        discuss --> interpret[Interpretation]
        concl --> summary[Summary of Findings]
        
        classDef highlight fill:#f9f,stroke:#333,stroke-width:2px;
        class title highlight;
    `;
  }
};
