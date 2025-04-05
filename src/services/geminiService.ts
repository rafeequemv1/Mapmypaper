import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Add or update the generateMermaidDiagram function to handle different visualization types
export const generateMermaidDiagram = async (
  type: "mindmap" | "flowchart",
  pdfText: string
): Promise<string> => {
  try {
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
