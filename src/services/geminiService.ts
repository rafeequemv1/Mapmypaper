import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-pro-latest";

// Use import.meta.env instead of process.env for Vite projects
function initializeGeminiModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  
  // Add console log to debug the API key (value will not be shown in production)
  console.log("Gemini API Key present:", apiKey ? "Yes" : "No");
  
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
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

// Added function to generate structured summary for the Summary modal
export async function generateStructuredSummary(): Promise<any> {
  try {
    // Get current PDF text
    const pdfText = await getCurrentPdfText();
    if (!pdfText) {
      throw new Error("No PDF content available");
    }

    const prompt = `
      Create a comprehensive structured summary of the following academic paper.
      Return the result as a JSON object with the following sections:
      {
        "Summary": "A concise overview of the entire paper",
        "Key Findings": "The most important discoveries or results",
        "Objectives": "The goals or aims of the research",
        "Methods": "The methodology used",
        "Results": "The outcomes of the research",
        "Conclusions": "The interpretations and implications",
        "Key Concepts": "Important terms and ideas covered"
      }
      
      For each section, provide detailed information with important points.
      When referencing specific information from the paper, include citation markers in the format [citation:pageX] where X is the page number.
      
      PDF Content:
      ${pdfText.slice(0, 8000)}
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const jsonString = response.text();

    try {
      // Attempt to parse the response as JSON
      return JSON.parse(jsonString);
    } catch (jsonError) {
      // If parsing fails, attempt to extract JSON from the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (extractionError) {
          console.error("Failed to parse extracted JSON:", extractionError);
          throw new Error("Failed to parse structured summary JSON.");
        }
      } else {
        console.error("No JSON found in response.");
        throw new Error("No JSON found in structured summary response.");
      }
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate structured summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Added function for Mind Map generation directly from PDF
export async function generateMindmapFromPdf(pdfKey: string | null = null): Promise<any> {
  try {
    // Get current PDF text
    const pdfText = await getCurrentPdfText(pdfKey);
    if (!pdfText) {
      throw new Error("No PDF content available");
    }

    // Mindmap generation prompt
    const mindmapPrompt = `
      Create a mind map JSON structure from the following PDF content.
      The mind map should represent the key concepts, ideas, and relationships in the text.
      Use a hierarchical structure with a central topic and subtopics.
      Include a title, and array of child nodes with their own titles and child nodes.
      Keep the mindmap concise and focused on the most important information.
      Ensure that the JSON structure is valid and well-formed.
      
      PDF Content:
      ${pdfText.slice(0, 8000)}
    `;

    return generateMindMapFromText(mindmapPrompt);
  } catch (error) {
    console.error("Error generating mind map from PDF:", error);
    throw new Error(`Failed to generate mind map from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Added function for sequence diagram generation
export async function generateSequenceDiagramFromPdf(pdfKey: string | null = null): Promise<string> {
  try {
    // Get current PDF text
    const pdfText = await getCurrentPdfText(pdfKey);
    if (!pdfText) {
      throw new Error("No PDF content available");
    }

    // Sequence diagram prompt
    const sequencePrompt = `
      Create a mermaid.js sequence diagram syntax for the following PDF content. Focus on the main processes, interactions, or sequences described.
      Use proper mermaid.js sequence diagram syntax with actors and messages.
      Keep it under 15 interactions for clarity.
      
      PDF Content:
      ${pdfText.slice(0, 8000)}
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([sequencePrompt]);
    const response = await result.response;
    const text = response.text();

    // Extract the mermaid code from the response
    let mermaidCode = text;
    
    // If the response contains markdown code blocks, extract just the sequence diagram code
    if (text.includes("```mermaid")) {
      mermaidCode = text.split("```mermaid")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      mermaidCode = text.split("```")[1].split("```")[0].trim();
    }
    
    // Ensure it starts with the proper sequence diagram syntax
    if (!mermaidCode.trim().startsWith("sequenceDiagram")) {
      mermaidCode = "sequenceDiagram\n" + mermaidCode;
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error(`Failed to generate sequence diagram: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Add chat function for interacting with PDF content
export async function chatWithGeminiAboutPdf(message: string): Promise<string> {
  try {
    // Get current PDF text
    const pdfText = await getCurrentPdfText();
    if (!pdfText) {
      throw new Error("No PDF content available");
    }

    const prompt = `
      I'll act as your research assistant for this document.
      Here's the document content:
      ---
      ${pdfText.slice(0, 6000)}
      ---
      
      Now, please respond to this question or instruction:
      ${message}
      
      When referring to specific content from the document, include page citations in the format [citation:pageX] where X is the page number.
    `;

    const model = initializeGeminiModel();
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat with Gemini about PDF:", error);
    throw new Error(`Failed to chat about PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to analyze uploaded images with Gemini
export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  try {
    // Process the image data (base64)
    const imageBytes = imageData.split(",")[1]; // Remove data URL prefix
    
    const model = initializeGeminiModel();
    const prompt = "Analyze this image in detail. Describe what you see, including any text, diagrams, charts, or other visual elements. If it contains data or information, summarize it.";
    
    // Use multimodal capabilities (text + image)
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBytes,
          mimeType: "image/jpeg" // Assume JPEG, but could be dynamic based on the actual image
        }
      }
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to analyze uploaded files with Gemini
export async function analyzeFileWithGemini(fileContent: string, fileName: string, fileType: string): Promise<string> {
  try {
    const prompt = `
      Analyze the following file content:
      Filename: ${fileName}
      File type: ${fileType}
      
      Content:
      ${fileContent.slice(0, 8000)}
      
      Provide a detailed analysis of this file. Include key points, data insights, and any patterns you observe.
      If it's structured data (like CSV or JSON), summarize the structure and important information.
      Highlight any interesting or unusual aspects of the content.
    `;
    
    const model = initializeGeminiModel();
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing file with Gemini:", error);
    throw new Error(`Failed to analyze file: ${error instanceof Error ? error.message : String(error)}`);
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
      if (cachedText) return cachedText;
      
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
