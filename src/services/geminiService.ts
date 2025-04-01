
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Generate a mind map from text
export async function generateMindMapFromText(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a mind map based on the following text. Format the response as a JSON object with a 'nodeData' property that has an 'id', 'topic', and 'children' array. Each child should have an 'id' and 'topic'. Make it detailed but focused, with clear hierarchical relationships:

    ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/```json([\s\S]*?)```/) || 
                     responseText.match(/```([\s\S]*?)```/) ||
                     [null, responseText];
    
    let jsonText = jsonMatch[1] || responseText;
    
    // Clean up the JSON text
    jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    
    // Parse the JSON
    const mindMapData = JSON.parse(jsonText);
    return mindMapData;
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map");
  }
}

// Chat with Gemini about PDF content
export async function chatWithGeminiAboutPdf(message: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "I'll share text from a PDF document. Please help me understand it." }],
        },
        {
          role: "model",
          parts: [{ text: "I'd be happy to help you understand text from your PDF document. Please share the content or specific sections you'd like me to explain." }],
        },
      ],
    });
    
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    throw new Error("Failed to chat with AI");
  }
}

// Generate a structured summary from the PDF
export async function generateStructuredSummary(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a structured summary of the following text. Include key points, main ideas, and conclusions. Format it with clear headings and bullet points:

    ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}

// Generate a flowchart from PDF text
export async function generateFlowchartFromPdf(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a Mermaid.js flowchart diagram based on the following text. Focus on processes, sequences, or hierarchies:

    ${text}
    
    Please provide only the Mermaid.js code without any explanations. Use the flowchart syntax.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mermaidCode = response.text().replace(/```mermaid\s|\s```/g, '').trim();
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error("Failed to generate flowchart");
  }
}

// Generate a mindmap representation from PDF text
export async function generateMindmapFromPdf(text: string) {
  return generateMindMapFromText(text); // Reuse existing function
}

// Generate a sequence diagram from PDF text
export async function generateSequenceDiagramFromPdf(text: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a Mermaid.js sequence diagram based on the following text. Focus on interactions and flows between entities:

    ${text}
    
    Please provide only the Mermaid.js code without any explanations. Use the sequenceDiagram syntax.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mermaidCode = response.text().replace(/```mermaid\s|\s```/g, '').trim();
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error("Failed to generate sequence diagram");
  }
}
