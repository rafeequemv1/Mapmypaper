
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Chat with the Gemini model about the PDF content
 */
export const chatWithGeminiAboutPdf = async (prompt: string) => {
  try {
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText") || '';
    
    if (!pdfText) {
      throw new Error("No PDF content found");
    }

    // Get a generative model (Gemini model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Here's a PDF document: " + pdfText.substring(0, 10000) }],
        },
        {
          role: "model",
          parts: [{ text: "I've received the PDF content. How can I help you with this document?" }],
        },
      ],
    });

    // Send the prompt and get the response
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error in Gemini chat:", error);
    throw error;
  }
};

/**
 * Generate a mindmap from the PDF content
 */
export const generateMindmapFromPdf = async () => {
  try {
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText") || '';
    
    if (!pdfText) {
      throw new Error("No PDF content found");
    }

    // Generate a prompt for creating a mindmap
    const prompt = `
    Create a detailed mindmap in Mermaid.js mindmap format for the following PDF document content. 
    Format the mindmap with the main topic as the root, and key concepts as branches. 
    Each branch should have detailed sub-branches with proper hierarchical organization.
    Use the exact mindmap format with proper indentation.
    
    PDF Content (first 8000 characters):
    ${pdfText.substring(0, 8000)}
    
    Format your response ONLY as valid Mermaid.js mindmap code without any explanations or markdown.
    Start with "mindmap" and use proper indentation for nodes.
    `;

    // Get a generative model (Gemini model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate the mindmap
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw error;
  }
};

/**
 * Generate a flowchart from the PDF content
 */
export const generateFlowchartFromPdf = async () => {
  try {
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText") || '';
    
    if (!pdfText) {
      throw new Error("No PDF content found");
    }

    // Generate a prompt for creating a flowchart
    const prompt = `
    Create a detailed flowchart in Mermaid.js format for the following PDF document content. 
    Analyze the document to identify processes, workflows, or methodologies mentioned and represent them as a clear flowchart.
    Use the exact flowchart format with proper syntax.
    
    PDF Content (first 8000 characters):
    ${pdfText.substring(0, 8000)}
    
    Format your response ONLY as valid Mermaid.js flowchart code without any explanations or markdown.
    Start with "flowchart TD" and use proper syntax for nodes and connections.
    `;

    // Get a generative model (Gemini model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate the flowchart
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw error;
  }
};

/**
 * Generate a sequence diagram from the PDF content
 */
export const generateSequenceDiagramFromPdf = async () => {
  try {
    // Get PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText") || '';
    
    if (!pdfText) {
      throw new Error("No PDF content found");
    }

    // Generate a prompt for creating a sequence diagram
    const prompt = `
    Create a detailed sequence diagram in Mermaid.js format for the following PDF document content. 
    Analyze the document to identify interactions, communications, or sequences of events and represent them as a clear sequence diagram.
    Use the exact sequence diagram format with proper syntax.
    
    PDF Content (first 8000 characters):
    ${pdfText.substring(0, 8000)}
    
    Format your response ONLY as valid Mermaid.js sequence diagram code without any explanations or markdown.
    Start with "sequenceDiagram" and use proper syntax for actors and messages.
    `;

    // Get a generative model (Gemini model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate the sequence diagram
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw error;
  }
};

/**
 * Generate a mind map from text content
 */
export const generateMindMapFromText = async (text: string) => {
  try {
    if (!text) {
      throw new Error("No text content provided");
    }

    // Generate a prompt for creating a mindmap
    const prompt = `
    Create a detailed mindmap in Mermaid.js mindmap format for the following text content. 
    Format the mindmap with the main topic as the root, and key concepts as branches. 
    Each branch should have detailed sub-branches with proper hierarchical organization.
    Use the exact mindmap format with proper indentation.
    
    Text Content:
    ${text}
    
    Format your response ONLY as valid Mermaid.js mindmap code without any explanations or markdown.
    Start with "mindmap" and use proper indentation for nodes.
    `;

    // Get a generative model (Gemini model)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate the mindmap
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mindmapCode = response.text();
    
    return mindmapCode;
  } catch (error) {
    console.error("Error generating mindmap from text:", error);
    throw error;
  }
};
