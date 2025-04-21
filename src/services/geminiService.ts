
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with API key
// Use the provided API key or the environment variable if available
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBXCTrrbB6hepfwO9EdgDn816TL1tRoGWU";
const genAI = new GoogleGenerativeAI(apiKey);

// Get the generative model (Gemini Pro)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Model that can handle both text and images
const visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

/**
 * Generate a mind map from text extracted from a PDF
 * Returns a Mermaid diagram string directly (not JSON)
 */
export async function generateMindmapFromPdf(): Promise<string> {
  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
    }

    // First, check if we have PDF text in session storage
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText || pdfText.trim() === "") {
      throw new Error("No PDF content available. Please upload a PDF document first.");
    }

    // For long PDFs, we need to truncate to stay within token limits
    const truncatedText = pdfText.length > 15000 ? pdfText.substring(0, 15000) + "..." : pdfText;

    // Construct the prompt
    const prompt = `
      Generate a mind map in Mermaid.js syntax based on the PDF content below.
      
      The mind map should:
      - Start with "mindmap" declaration
      - Have a root node with the paper's main topic 
      - Include branches for key sections (methodology, results, discussion)
      - Include subbranches for important details, findings, and concepts
      - Use appropriate styling for readability (classDef statements)
      - Follow the Mermaid.js mindmap syntax exactly
      
      Here's the PDF content:
      ${truncatedText}
      
      Only return the Mermaid syntax - no explanations, no markdown formatting, just the mindmap code.
    `;

    // Get response from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract just the Mermaid code (removing any markdown code blocks if present)
    let mindmapCode = responseText.trim();
    
    // Clean up any markdown formatting that might be in the response
    mindmapCode = mindmapCode.replace(/```mermaid\s*/g, "").replace(/```\s*$/g, "");
    mindmapCode = mindmapCode.replace(/```mindmap\s*/g, "").replace(/```\s*$/g, "");
    
    // Validate that it starts with "mindmap"
    if (!mindmapCode.trim().startsWith("mindmap")) {
      mindmapCode = "mindmap\n" + mindmapCode;
    }
    
    return mindmapCode;
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw new Error(`Failed to generate mindmap: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a flowchart from a PDF
 * @param pdfKey Optional specific PDF key to use
 * @returns Mermaid flowchart code as string
 */
export async function generateFlowchartFromPdf(pdfKey: string | null = null): Promise<string> {
  try {
    // Get current PDF text either from the specific key or from session storage
    let pdfText: string | null = null;
    
    if (pdfKey) {
      pdfText = sessionStorage.getItem(`pdfText_${pdfKey}`);
    }
    
    // If no text found with the specific key, try the default key
    if (!pdfText) {
      pdfText = sessionStorage.getItem("pdfText");
    }
    
    // Also try to get from mindmap data as a last resort
    if (!pdfText && pdfKey) {
      const mindMapData = sessionStorage.getItem(`mindMapData_${pdfKey}`);
      if (mindMapData) {
        // We have mindmap data but no direct text - we can still generate a flowchart
        // based on the mindmap structure
        const parsedData = JSON.parse(mindMapData);
        if (parsedData && parsedData.topic) {
          // Use the mindmap data to create a simple extraction of text
          pdfText = extractTextFromMindMap(parsedData);
        }
      }
    }
    
    if (!pdfText || pdfText.trim() === "") {
      throw new Error("No PDF content available. Please upload a PDF document first.");
    }

    // For long PDFs, we need to truncate to stay within token limits
    const truncatedText = pdfText.length > 15000 ? pdfText.substring(0, 15000) + "..." : pdfText;

    // Construct the prompt
    const prompt = `
      Generate a flowchart in Mermaid.js syntax based on the PDF content below.
      
      The flowchart should:
      - Start with "flowchart LR" (left to right) declaration
      - Represent the main process or argument flow of the paper
      - Use appropriate node shapes ([], (), {}, etc.)
      - Connect nodes with arrows showing the logical flow
      - Include appropriate styling with classDef statements
      - Follow the Mermaid.js flowchart syntax exactly
      
      Here's the PDF content:
      ${truncatedText}
      
      Return ONLY the Mermaid syntax - no explanations, no markdown formatting, just the flowchart code.
    `;

    // Get response from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract just the Mermaid code (removing any markdown code blocks if present)
    let flowchartCode = responseText.trim();
    
    // Clean up any markdown formatting that might be in the response
    flowchartCode = flowchartCode.replace(/```mermaid\s*/g, "").replace(/```\s*$/g, "");
    flowchartCode = flowchartCode.replace(/```flowchart\s*/g, "").replace(/```\s*$/g, "");
    
    // Validate that it starts with "flowchart"
    if (!flowchartCode.trim().startsWith("flowchart")) {
      flowchartCode = "flowchart LR\n" + flowchartCode;
    }
    
    return flowchartCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error(`Failed to generate flowchart: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a sequence diagram from a PDF
 * @param pdfKey Optional specific PDF key to use
 * @returns Mermaid sequence diagram code as string
 */
export async function generateSequenceDiagramFromPdf(pdfKey: string | null = null): Promise<string> {
  try {
    // Get current PDF text either from the specific key or from session storage
    let pdfText: string | null = null;
    
    if (pdfKey) {
      pdfText = sessionStorage.getItem(`pdfText_${pdfKey}`);
    }
    
    // If no text found with the specific key, try the default key
    if (!pdfText) {
      pdfText = sessionStorage.getItem("pdfText");
    }
    
    if (!pdfText || pdfText.trim() === "") {
      throw new Error("No PDF content available. Please upload a PDF document first.");
    }

    // For long PDFs, we need to truncate to stay within token limits
    const truncatedText = pdfText.length > 15000 ? pdfText.substring(0, 15000) + "..." : pdfText;

    // Construct the prompt
    const prompt = `
      Generate a sequence diagram in Mermaid.js syntax based on the PDF content below.
      
      The sequence diagram should:
      - Start with "sequenceDiagram" declaration
      - Identify key actors/participants from the paper
      - Show the sequence of interactions between participants
      - Include activations where appropriate
      - Follow the Mermaid.js sequence diagram syntax exactly
      
      Here's the PDF content:
      ${truncatedText}
      
      Return ONLY the Mermaid syntax - no explanations, no markdown formatting, just the sequence diagram code.
    `;

    // Get response from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract just the Mermaid code (removing any markdown code blocks if present)
    let sequenceDiagramCode = responseText.trim();
    
    // Clean up any markdown formatting that might be in the response
    sequenceDiagramCode = sequenceDiagramCode.replace(/```mermaid\s*/g, "").replace(/```\s*$/g, "");
    sequenceDiagramCode = sequenceDiagramCode.replace(/```sequenceDiagram\s*/g, "").replace(/```\s*$/g, "");
    
    // Validate that it starts with "sequenceDiagram"
    if (!sequenceDiagramCode.trim().startsWith("sequenceDiagram")) {
      sequenceDiagramCode = "sequenceDiagram\n" + sequenceDiagramCode;
    }
    
    return sequenceDiagramCode;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error(`Failed to generate sequence diagram: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a mind map from text
 * @param text Raw text content from PDF
 * @returns JSON structure for mind map
 */
export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
    }

    if (!text || text.trim() === "") {
      throw new Error("No text content provided for mind map generation.");
    }

    // Store the PDF text in session storage for other generation features to use
    sessionStorage.setItem("pdfText", text);
    
    // For long texts, we need to truncate to stay within token limits
    const truncatedText = text.length > 25000 ? text.substring(0, 25000) + "..." : text;

    // Construct the prompt for JSON mind map format
    const prompt = `
      Create a hierarchical mind map structure based on the academic paper content below.
      Format your response as a properly formatted JSON object that can be used directly in a JavaScript application.
      
      The JSON should follow this exact structure:
      {
        "topic": "Main Title of Paper",
        "children": [
          {
            "topic": "Main Section 1",
            "children": [
              {
                "topic": "Subsection 1.1",
                "children": [
                  {"topic": "Detail 1.1.1"},
                  {"topic": "Detail 1.1.2"}
                ]
              },
              {"topic": "Subsection 1.2"}
            ]
          },
          {
            "topic": "Main Section 2",
            "children": [...]
          }
        ]
      }
      
      Capture the hierarchical structure of the paper including:
      - Paper title as the root topic
      - Main sections (like Abstract, Introduction, Methods, Results, Discussion)
      - Key subsections
      - Important findings, methodologies, and conclusions
      
      Paper content:
      ${truncatedText}
      
      IMPORTANT: Return ONLY valid JSON, no explanations, no markdown formatting, no text before or after the JSON.
      Ensure all quotes are properly escaped within string values.
    `;

    // Get response from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Clean up any markdown formatting that might be in the response
    let jsonString = responseText.trim();
    jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
    
    try {
      // Parse the returned JSON
      const mindMapData = JSON.parse(jsonString);
      return mindMapData;
    } catch (parseError) {
      console.error("Failed to parse JSON mind map:", parseError);
      
      // Return a simplified structure with the error message
      return {
        topic: "Paper Analysis (Error in Processing)",
        children: [
          {
            topic: "Error Processing Paper",
            children: [
              { topic: "AI could not generate a proper mind map" },
              { topic: "Please try again or with a different paper" }
            ]
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    throw new Error(`Failed to generate mind map: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Chat with Gemini about a PDF
 * @param userMessage The user's message
 * @returns AI response as string
 */
export async function chatWithGeminiAboutPdf(userMessage: string): Promise<string> {
  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
    }

    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText || pdfText.trim() === "") {
      throw new Error("No PDF content available. Please upload a PDF document first.");
    }
    
    // Truncate the PDF text to fit within token limits
    const truncatedText = pdfText.length > 15000 ? pdfText.substring(0, 15000) + "..." : pdfText;
    
    // System prompt to give context about the PDF
    const systemPrompt = `
      You are an AI research assistant helping a user understand an academic paper. 
      Below is the content of the paper the user is asking about. 
      When answering questions, refer specifically to content in the paper and cite page numbers where possible.
      
      Paper content:
      ${truncatedText}
      
      When citing information from specific pages, use the format [citation:pageX] where X is the page number.
    `;
    
    // Get response from the model - using the correct API format
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage }
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error chatting with Gemini about PDF:", error);
    throw new Error(`Failed to get response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze an image with Gemini
 * @param imageData Base64 encoded image data
 * @returns AI analysis as string
 */
export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  try {
    // Remove the data URL prefix if present
    const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, "");
    
    // Create a file part from the base64 data
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg" // Assuming JPEG, adjust if needed
      }
    };
    
    // The prompt for image analysis
    const prompt = "Analyze this image in detail. Describe what you see, including any text, diagrams, charts, or visual elements. If it appears to be from an academic paper, explain what information it's conveying.";
    
    // Generate content with the vision model
    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze a file with Gemini
 * @param fileContent File content as string
 * @param fileName Name of the file
 * @param fileType MIME type of the file
 * @returns AI analysis as string
 */
export async function analyzeFileWithGemini(
  fileContent: string,
  fileName: string,
  fileType: string
): Promise<string> {
  try {
    // Create a prompt based on the file type
    let prompt = `Analyze this ${fileType} file named "${fileName}". `;
    
    if (fileType === "text/plain") {
      prompt += "The content of the text file is provided below. Summarize the key points and provide insights:\n\n";
    } else if (fileType === "text/csv" || fileType.includes("spreadsheet")) {
      prompt += "The content of the CSV/spreadsheet file is provided below. Parse this data, identify patterns, and summarize the key information:\n\n";
    } else if (fileType === "application/json") {
      prompt += "The content of the JSON file is provided below. Explain the structure and key data points:\n\n";
    } else {
      prompt += "The content is provided below. Do your best to analyze it:\n\n";
    }
    
    // Limit content size
    const truncatedContent = fileContent.length > 15000 
      ? fileContent.substring(0, 15000) + "...[content truncated due to size]" 
      : fileContent;
    
    // Full prompt with file content
    const fullPrompt = prompt + truncatedContent;
    
    // Get response from the model
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error analyzing file with Gemini:", error);
    throw new Error(`Failed to analyze file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a structured summary of the PDF
 * @returns Structured summary object
 */
export async function generateStructuredSummary(): Promise<object> {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfText");
    
    if (!pdfText || pdfText.trim() === "") {
      throw new Error("No PDF content available. Please upload a PDF document first.");
    }
    
    // Truncate the PDF text to fit within token limits
    const truncatedText = pdfText.length > 20000 ? pdfText.substring(0, 20000) + "..." : pdfText;
    
    // Construct the prompt for structured summary
    const prompt = `
      Create a structured summary of this academic paper. Format your response as a JSON object with the following sections:
      
      1. Summary: A concise overview of the paper in 3-5 sentences
      2. Key Findings: The main discoveries or conclusions
      3. Objectives: What the paper set out to accomplish
      4. Methods: The approaches, techniques, or methods used
      5. Results: The outcomes or data obtained
      6. Conclusions: What the authors concluded
      7. Key Concepts: Important terms, theories, or concepts introduced
      
      Use [citation:pageX] format to indicate where information comes from in the paper.
      
      Paper content:
      ${truncatedText}
      
      Return ONLY the structured JSON object.
    `;
    
    // Get response from the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Clean up any markdown formatting
    let jsonString = responseText.trim();
    jsonString = jsonString.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
    
    try {
      // Parse the returned JSON
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse structured summary:", parseError);
      
      // Return a fallback structure
      return {
        "Summary": "Error parsing the AI response. Please try again.",
        "Key Findings": "Not available due to processing error.",
        "Objectives": "Not available due to processing error.",
        "Methods": "Not available due to processing error.",
        "Results": "Not available due to processing error.",
        "Conclusions": "Not available due to processing error.",
        "Key Concepts": "Not available due to processing error."
      };
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to extract text from mind map data for flowchart generation
function extractTextFromMindMap(mindMapData: any): string {
  let extractedText = '';
  
  if (mindMapData.topic) {
    extractedText += mindMapData.topic + ". ";
  }
  
  if (mindMapData.children && Array.isArray(mindMapData.children)) {
    mindMapData.children.forEach((child: any) => {
      extractedText += extractTextFromNode(child, 1) + " ";
    });
  }
  
  return extractedText;
}

// Recursive helper to extract text from mind map nodes
function extractTextFromNode(node: any, level: number): string {
  let text = node.topic || '';
  
  if (node.children && Array.isArray(node.children) && level < 3) {
    node.children.forEach((child: any) => {
      text += " " + extractTextFromNode(child, level + 1);
    });
  }
  
  return text;
}
