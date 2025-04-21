import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Get the generative model (Gemini Pro)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Generate a mind map from text extracted from a PDF
 * Returns a Mermaid diagram string directly (not JSON)
 */
export async function generateMindmapFromPdf(): Promise<string> {
  try {
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
    const text = response.text();
    
    // Extract just the Mermaid code (removing any markdown code blocks if present)
    let mindmapCode = text.trim();
    
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
    const text = response.text();
    
    // Extract just the Mermaid code (removing any markdown code blocks if present)
    let flowchartCode = text.trim();
    
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
 * Generate a mind map from text
 * @param text Raw text content from PDF
 * @returns JSON structure for mind map
 */
export async function generateMindMapFromText(text: string): Promise<any> {
  try {
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
    const text = response.text();
    
    // Clean up any markdown formatting that might be in the response
    let jsonString = text.trim();
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

// Other methods can be added here
