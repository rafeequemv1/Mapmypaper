import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-pro-latest";

function initializeGeminiModel() {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    const prompt = `
      Create a mind map JSON structure from the following text.
      The mind map should represent the key concepts, ideas, and relationships in the text.
      Use a hierarchical structure with a central topic and subtopics.
      Include a title, and array of child nodes with their own titles and child nodes.
      Keep the mindmap concise and focused on the most important information.
      Ensure that the JSON structure is valid and well-formed.
      
      Text:
      ${text.slice(0, 8000)}
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const jsonString = response.text();

    try {
      // Attempt to parse the entire response as JSON
      return JSON.parse(jsonString);
    } catch (jsonError) {
      // If parsing fails, attempt to extract JSON from the response
      const jsonMatch = jsonString.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (extractionError) {
          console.error("Failed to parse extracted JSON:", extractionError);
          throw new Error("Failed to parse extracted JSON.");
        }
      } else {
        console.error("No JSON found in response.");
        throw new Error("No JSON found in response.");
      }
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error(`Failed to generate mind map: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateSummaryFromText(text: string): Promise<string> {
  try {
    const prompt = `
      Create a concise summary of the following text, highlighting the key points and main ideas.
      The summary should be no more than 200 words.
      
      Text:
      ${text.slice(0, 8000)}
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateFlowchartFromPdf(pdfKey: string | null = null): Promise<string> {
  try {
    // Get current PDF text
    const pdfText = await getCurrentPdfText(pdfKey);
    if (!pdfText) {
      throw new Error("No PDF content available");
    }

    // Flowchart prompt
    const flowchartPrompt = `
      Create a mermaid.js flowchart syntax for the following PDF content. Focus on the main processes, relationships, or sequences described.
      Use 'flowchart LR' direction (left to right) and keep it under 20 nodes for clarity.
      Make sure to use proper mermaid.js syntax with nodes and connections.
      
      PDF Content:
      ${pdfText.slice(0, 8000)}
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([flowchartPrompt]);
    const response = await result.response;
    const text = response.text();

    // Extract the mermaid code from the response
    let mermaidCode = text;
    
    // If the response contains markdown code blocks, extract just the flowchart code
    if (text.includes("```mermaid")) {
      mermaidCode = text.split("```mermaid")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      mermaidCode = text.split("```")[1].split("```")[0].trim();
    }
    
    // Ensure it starts with the proper flowchart syntax
    if (!mermaidCode.trim().startsWith("flowchart")) {
      mermaidCode = "flowchart LR\n" + mermaidCode;
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error(`Failed to generate flowchart: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to get text from current PDF
async function getCurrentPdfText(pdfKey: string | null = null): Promise<string | null> {
  try {
    // If a specific pdfKey is provided, use it
    if (pdfKey) {
      const pdfDataString = sessionStorage.getItem(`hasPdfData_${pdfKey}`);
      if (!pdfDataString) return null;
      
      // Check for cached text for this PDF to avoid re-extraction
      const cachedText = sessionStorage.getItem(`pdfText_${pdfKey}`);
      if (cachedText) return cachedText;
      
      // Extract text using the stored PDF data
      const pdfData = await getPdfData(pdfKey);
      if (!pdfData) return null;
      
      // Use a simple text extraction method
      // (In a real app, you'd integrate with a PDF text extraction library)
      const extractedText = "Sample text extracted from PDF"; // Placeholder
      
      // Cache the extracted text
      sessionStorage.setItem(`pdfText_${pdfKey}`, extractedText);
      return extractedText;
    } else {
      // Get the current PDF's key if none is provided
      const currentPdfMeta = sessionStorage.getItem('currentPdf');
      if (!currentPdfMeta) return null;
      
      // Get the cached text for the current PDF
      const cachedText = sessionStorage.getItem(`pdfText_${currentPdfMeta}`);
      if (cachedText) return null;
      
      // If no cached text, extract from the current PDF
      const extractedText = "Sample text extracted from current PDF"; // Placeholder
      
      // Cache the extracted text
      sessionStorage.setItem(`pdfText_${currentPdfMeta}`, extractedText);
      return extractedText;
    }
  } catch (error) {
    console.error("Error getting PDF text:", error);
    return null;
  }
}

// Helper function to get PDF data from storage
async function getPdfData(pdfKey: string): Promise<string | null> {
  try {
    return sessionStorage.getItem(`pdfData_${pdfKey}`);
  } catch (error) {
    console.error("Error retrieving PDF data:", error);
    return null;
  }
}
