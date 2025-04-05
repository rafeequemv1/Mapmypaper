
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Helper function to check if API key is valid
const validateApiKey = () => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
};

// Add or update the generateMermaidDiagram function to handle different visualization types
export const generateMermaidDiagram = async (
  type: "mindmap" | "flowchart",
  pdfText: string
): Promise<string> => {
  try {
    // Validate API key
    validateApiKey();
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a prompt based on the visualization type
    let prompt = "";
    if (type === "mindmap") {
      prompt = `Based on the following text from a PDF document, generate a Mermaid mindmap diagram. 
      Focus on the main topics and their relationships. 
      Make sure the mindmap is well-structured and easy to understand.
      Only return the mermaid code block without any explanation or additional text.
      USE ONLY VALID MERMAID SYNTAX.
      
      Here's the text:
      ${pdfText.substring(0, 15000)}`;
    } else if (type === "flowchart") {
      prompt = `Based on the following text from a PDF document, generate a Mermaid flowchart diagram.
      Focus on processes, workflows, methods, or sequential steps described in the document.
      Use proper flowchart shapes: rectangles for processes, diamonds for decisions, etc.
      Make the flowchart clear, concise, and easy to follow.
      Only return the mermaid code block without any explanation or additional text.
      USE ONLY VALID MERMAID SYNTAX.
      
      Here's the text:
      ${pdfText.substring(0, 15000)}`;
    }

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract mermaid syntax from the response if it's in a code block
    if (text.includes("```mermaid")) {
      text = text.split("```mermaid")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    // Prepend the appropriate diagram type if it's not there
    if (type === "mindmap" && !text.trim().startsWith("mindmap")) {
      text = `mindmap\n${text}`;
    } else if (type === "flowchart" && !text.trim().startsWith("flowchart")) {
      text = `flowchart TD\n${text}`;
    }

    console.log(`Generated ${type} diagram with ${text.length} characters`);
    return text;
  } catch (error) {
    console.error(`Error generating ${type} diagram:`, error);
    throw new Error(`Failed to generate ${type} diagram: ${error.message}`);
  }
};

// Add function to generate mind map data from PDF text
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Validate API key
    validateApiKey();
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt for mind map generation
    const prompt = `Based on the following text from a PDF document, generate a JSON structure for a mind map. 
    The structure should represent the hierarchical organization of the document, focusing on the main topics and their subtopics.
    Follow this format:
    {
      "root": {
        "topic": "Main Document Title",
        "children": [
          {
            "topic": "Major Section 1",
            "children": [
              { "topic": "Subsection 1.1" },
              { "topic": "Subsection 1.2" }
            ]
          },
          {
            "topic": "Major Section 2",
            "children": [
              { "topic": "Subsection 2.1" },
              { "topic": "Subsection 2.2" }
            ]
          }
        ]
      }
    }
    
    Only return valid JSON without any explanation or additional text.
    
    Here's the text:
    ${pdfText.substring(0, 15000)}`;

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from the response if it's in a code block
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    // Parse the JSON response
    const mindMapData = JSON.parse(text);
    console.log("Mind map data generated successfully");
    
    return mindMapData;
  } catch (error) {
    console.error("Error generating mind map data:", error);
    throw new Error(`Failed to generate mind map: ${error.message}`);
  }
};

// Add function to chat with Gemini about the PDF content
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  try {
    // Validate API key
    validateApiKey();
    
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText');
    if (!pdfText) {
      throw new Error("No PDF text found in session storage");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt for chat
    const prompt = `You are a helpful research assistant. Your task is to answer questions about the following paper. 
    Provide detailed, informative responses with clear reasoning. When possible, include specific page citations in the format [citation:pageX] 
    where X is the page number.
    
    Document content (partial):
    ${pdfText.substring(0, 15000)}
    
    User question: ${message}
    
    Respond in a clear, educational manner. Use markdown formatting for better readability. If appropriate, use emojis 
    to make the response more engaging. Be precise about what's in the document versus what might be general knowledge.`;

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat with PDF:", error);
    throw new Error(`Chat error: ${error.message}`);
  }
};

// Add function to analyze image with Gemini
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Validate API key
    validateApiKey();
    
    // Initialize Gemini with vision capabilities
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare image data for Gemini API
    // The imageData is expected to be a base64 data URL (e.g., data:image/png;base64,...)
    const imagePart: Part = {
      inlineData: {
        data: imageData.split(',')[1], // Remove the data URL prefix
        mimeType: imageData.split(',')[0].split(':')[1].split(';')[0] // Extract MIME type
      }
    };

    // Create prompt for image analysis
    const prompt = `Analyze this image from an academic paper. Describe what you see in detail, explaining any charts, 
    diagrams, figures, tables, or text content. Focus on the academic significance and what information this visual is 
    trying to convey. If there are any formulas or specialized notation, explain those as well. Use markdown formatting 
    for better readability and use emojis where appropriate.`;

    // Generate response from Gemini with both text and image input
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error(`Image analysis error: ${error.message}`);
  }
};

// Add function to generate structured summary of the PDF
export const generateStructuredSummary = async (): Promise<any> => {
  try {
    // Validate API key
    validateApiKey();
    
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText');
    if (!pdfText) {
      throw new Error("No PDF text found in session storage");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt for structured summary
    const prompt = `Generate a comprehensive structured summary of the following academic paper. 
    Provide specific page citations in the format [citation:pageX] where X is the page number.
    
    The summary should be organized in this JSON structure with each field containing detailed content:
    {
      "Summary": "Overall summary of the paper",
      "Key Findings": "Main findings and contributions",
      "Objectives": "Research goals and objectives",
      "Methods": "Methodology used",
      "Results": "Key results and outcomes",
      "Conclusions": "Main conclusions and implications",
      "Key Concepts": "Important concepts and definitions"
    }
    
    Paper content:
    ${pdfText.substring(0, 15000)}
    
    Provide rich, detailed information for each section with proper markdown formatting. Use emojis where appropriate 
    to enhance readability. Always cite specific pages when referencing content from the paper.`;

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from the response if it's in a code block
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    try {
      // Parse the JSON response
      const summaryData = JSON.parse(text);
      console.log("Structured summary generated successfully");
      return summaryData;
    } catch (jsonError) {
      console.error("Failed to parse JSON from summary response, returning text instead");
      
      // If JSON parsing fails, create a simple structured response
      return {
        "Summary": "Error parsing structured summary. Please try again.",
        "Key Findings": text.substring(0, 200) + "...",
        "Objectives": "JSON parsing error",
        "Methods": "JSON parsing error",
        "Results": "JSON parsing error",
        "Conclusions": "JSON parsing error",
        "Key Concepts": "JSON parsing error"
      };
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Summary generation error: ${error.message}`);
  }
};
