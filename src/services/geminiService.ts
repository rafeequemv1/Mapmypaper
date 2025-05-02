
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Updated model names for the current API version
// Gemini Pro Vision model
const modelVision = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

// Gemini Pro model (text-only)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Function to check API key validity 
const isValidApiKey = () => {
  return API_KEY && API_KEY.length > 0 && API_KEY !== "AIzaSyAybTv2s4hmijfOuLSEoPeqdMQuuqUCS9c";
};

// Function to get the Gemini Pro model
const getGeminiModel = async () => {
  if (!isValidApiKey()) {
    throw new Error("Gemini API key is invalid or missing. Please set a valid VITE_GEMINI_API_KEY environment variable.");
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
    if (!isValidApiKey()) {
      return "⚠️ The Gemini API key appears to be missing or invalid. Please provide a valid API key in your environment variables.";
    }
    
    const gemini = await getGeminiModel();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    
    // Handle specific error types
    if (error.message && error.message.includes("overloaded")) {
      return "⚠️ The Gemini API is currently overloaded. Please try again in a few minutes.";
    } else if (error.message && error.message.includes("API key")) {
      return "⚠️ The Gemini API key is invalid. Please check your API key and try again.";
    }
    
    // Generic error
    return "⚠️ An error occurred while processing your request. Please try again later.";
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

    if (!isValidApiKey()) {
      return "⚠️ The Gemini API key appears to be missing or invalid. Please provide a valid API key in your environment variables.";
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
    
    // Handle specific error types
    if (error.message && error.message.includes("overloaded")) {
      return "⚠️ The Gemini API is currently overloaded. Please try again in a few minutes.";
    } else if (error.message && error.message.includes("API key")) {
      return "⚠️ The Gemini API key is invalid. Please check your API key and try again.";
    } else if (error.message && error.message.includes("Image data")) {
      return "⚠️ Invalid image data provided. Please try capturing the area again.";
    }
    
    // Generic error
    return "⚠️ An error occurred while analyzing the image. Please try again later.";
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
    
    if (!isValidApiKey()) {
      return "⚠️ The Gemini API key appears to be missing or invalid. Please provide a valid API key in your environment variables.";
    }
    
    console.log(`Explaining selected text (length: ${selectedText.length} characters)`);
    
    const prompt = `
      Please explain the following text in clear, simple terms. If it contains academic or technical 
      concepts, provide definitions and context. Use bullet points where appropriate.
      
      Selected text:
      "${selectedText}"
      
      Provide your explanation with relevant emojis and citations if applicable.
    `;
    
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error explaining selected text:", error);
    
    // Handle specific error types
    if (error.message && error.message.includes("overloaded")) {
      return "⚠️ The Gemini API is currently overloaded. Please try again in a few minutes.";
    } else if (error.message && error.message.includes("API key")) {
      return "⚠️ The Gemini API key is invalid. Please check your API key and try again.";
    } else if (error.message && error.message.includes("text is required")) {
      return "⚠️ Please select valid text to explain.";
    }
    
    return `⚠️ Failed to explain selected text: ${error.message}`;
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
    
    if (!isValidApiKey()) {
      console.warn("Invalid Gemini API key - returning fallback structure");
      return {
        root: {
          topic: "Document Structure (API Key Invalid)",
          children: [
            { topic: "Please set a valid Gemini API key" },
            { topic: "Check the .env file and update VITE_GEMINI_API_KEY" }
          ]
        }
      };
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
            { topic: "Unable to parse document structure" },
            { topic: "API response format error" }
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    
    // Return a fallback mind map structure with error information
    return {
      root: {
        topic: "Error Processing Document",
        children: [
          { 
            topic: "API Error", 
            children: [
              { topic: error.message || "Unknown error" },
              { topic: "Check console for details" }
            ]
          },
          { 
            topic: "Troubleshooting", 
            children: [
              { topic: "Verify API key is valid" },
              { topic: "Check network connection" },
              { topic: "Try again later if service is overloaded" }
            ]
          }
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
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    if (!isValidApiKey()) {
      return "⚠️ The Gemini API key appears to be invalid or missing. Please provide a valid API key in your environment variables.";
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
    
    // Handle specific error types
    if (error.message && error.message.includes("overloaded")) {
      return "⚠️ The Gemini API is currently overloaded. Please try again in a few minutes.";
    } else if (error.message && error.message.includes("API key")) {
      return "⚠️ The Gemini API key is invalid. Please check your API key and try again.";
    }
    
    return `⚠️ Failed to generate structured summary from text: ${error.message}`;
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
    
    if (!isValidApiKey()) {
      return `
        graph TD
          A[API Key Error] --> B[Invalid Gemini API Key]
          B --> C[Check Environment Variables]
          B --> D[Update VITE_GEMINI_API_KEY]
          
          classDef error fill:#f96,stroke:#333,stroke-width:2px;
          class A,B error;
      `;
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
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let flowchartSyntax = response.text();
    
    console.log("Received flowchart syntax from Gemini API");
    
    // Ensure the flowchart syntax starts with graph TD or graph LR
    flowchartSyntax = flowchartSyntax.replace(/```mermaid|```/g, '').trim();
    
    if (!flowchartSyntax.startsWith('graph TD') && !flowchartSyntax.startsWith('graph LR')) {
      console.warn("Generated syntax doesn't start with graph TD or graph LR, prepending graph TD");
      flowchartSyntax = `graph TD\n${flowchartSyntax}`;
    }
    
    return flowchartSyntax;
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
