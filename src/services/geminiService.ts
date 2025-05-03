
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

// Initialize the Gemini API with the API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini API
export function initializeGeminiAPI() {
  try {
    if (!API_KEY) {
      throw new Error("Missing Gemini API key in .env file");
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini API:", error);
    return false;
  }
}

// Ensure API is initialized
initializeGeminiAPI();

// Default safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// Generate mind map from text
export async function generateMindMapFromText(text: string) {
  console.log("Generating mind map from text of length:", text.length);
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    // Trim the text if it's too long (Gemini has token limits)
    const MAX_TEXT_LENGTH = 20000; // Adjust as needed
    const trimmedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) + "... [TRUNCATED]" 
      : text;
    
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
    Create a mind map of the following academic text.
    Format the response as a JSON object representing a mind map.
    Follow these guidelines:
    1. The mind map should have a single root node representing the main title/topic of the text.
    2. Include 5-7 main branches (children of the root) representing key sections or concepts in the text.
    3. Each main branch should have 2-5 sub-branches with specific details or examples.
    4. Use clear, concise language for all node topics.
    5. Maintain hierarchical relationships between concepts.
    
    The mind map should be formatted exactly like this example:
    {
      "nodeData": {
        "id": "root",
        "topic": "Main Title/Topic",
        "children": [
          {
            "id": "branch1",
            "topic": "First Main Branch",
            "direction": 0,
            "children": [
              {"id": "branch1-1", "topic": "Sub-branch 1 of First Branch"},
              {"id": "branch1-2", "topic": "Sub-branch 2 of First Branch"}
            ]
          },
          {
            "id": "branch2",
            "topic": "Second Main Branch",
            "direction": 0,
            "children": [
              {"id": "branch2-1", "topic": "Sub-branch 1 of Second Branch"},
              {"id": "branch2-2", "topic": "Sub-branch 2 of Second Branch"}
            ]
          }
        ]
      }
    }
    
    Here's the text to analyze:
    ${trimmedText}
    
    Return ONLY the JSON object, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received response from Gemini API");
    
    // Extract JSON from response
    let jsonStr = responseText;
    
    // Handle potential formatting issues in the response
    if (jsonStr.includes("```json")) {
      jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
    } else if (jsonStr.includes("```")) {
      jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
    }
    
    // Parse the JSON
    try {
      const mindMapData = JSON.parse(jsonStr);
      console.log("Successfully parsed mind map data");
      return mindMapData;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.error("Raw response:", jsonStr);
      throw new Error("Failed to parse mind map data from AI response");
    }
  } catch (error: any) {
    console.error("Error generating mind map:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    if (error.message?.includes("403")) {
      throw new Error("Gemini API access denied. Please check your API key.");
    }
    
    if (error.message?.includes("503")) {
      throw new Error("Gemini service unavailable. Please try again later.");
    }
    
    // Default error with more information
    throw new Error(`Failed to generate mind map: ${error.message || "Unknown error"}`);
  }
}

// Generate a flowchart from text
export async function generateFlowchartFromText(text: string) {
  console.log("Generating flowchart from text of length:", text.length);
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    // Trim the text if it's too long (Gemini has token limits)
    const MAX_TEXT_LENGTH = 20000; // Adjust as needed
    const trimmedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) + "... [TRUNCATED]" 
      : text;
    
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });

    const prompt = `
    Create a flowchart diagram of the following academic text.
    Format the response using Mermaid syntax.
    Follow these guidelines:
    1.  Identify the key steps, processes, or components described in the text.
    2.  Represent each step/process/component as a node in the flowchart.
    3.  Connect the nodes with arrows to show the flow of information or execution.
    4.  Use labels on the arrows to describe the relationships between the nodes.
    5.  Keep the diagram simple and easy to understand.
    
    Example Mermaid syntax:
    \`\`\`
    graph TD
        A[Start] --> B(Process)
        B --> C{Decision}
        C -- Yes --> D[Result 1]
        C -- No --> E[Result 2]
    \`\`\`
    
    Here's the text to analyze:
    ${trimmedText}
    
    Return ONLY the Mermaid syntax, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mermaidSyntax = response.text();
    
    console.log("Received response from Gemini API");
    
    return mermaidSyntax;
  } catch (error: any) {
    console.error("Error generating flowchart:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    if (error.message?.includes("403")) {
      throw new Error("Gemini API access denied. Please check your API key.");
    }
    
    if (error.message?.includes("503")) {
      throw new Error("Gemini service unavailable. Please try again later.");
    }
    
    // Default error with more information
    throw new Error(`Failed to generate flowchart: ${error.message || "Unknown error"}`);
  }
}

// Chat with Gemini about PDF content
export async function chatWithGeminiAboutPdf(prompt: string) {
  console.log("Chatting with Gemini about PDF content, prompt length:", prompt.length);
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const chatResponse = response.text();
    
    return chatResponse;
  } catch (error: any) {
    console.error("Error chatting with Gemini:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    if (error.message?.includes("403")) {
      throw new Error("Gemini API access denied. Please check your API key.");
    }
    
    if (error.message?.includes("503")) {
      throw new Error("Gemini service unavailable. Please try again later.");
    }
    
    throw new Error(`Failed to chat: ${error.message || "Unknown error"}`);
  }
}

// Generate a structured summary of PDF content
export async function generateStructuredSummary(pdfText: string) {
  console.log("Generating structured summary of PDF content, length:", pdfText.length);
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    // Trim the text if it's too long
    const MAX_TEXT_LENGTH = 25000;
    const trimmedText = pdfText.length > MAX_TEXT_LENGTH 
      ? pdfText.substring(0, MAX_TEXT_LENGTH) + "... [TRUNCATED]" 
      : pdfText;
    
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });
    
    const prompt = `
    Create a detailed, structured summary of the following academic document.
    Include the following sections:
    1. Title and authors (if provided)
    2. Main topic and objectives
    3. Key findings and results
    4. Methodology summary
    5. Conclusions
    6. Implications and future work
    
    Format your response with markdown headings, bullet points, and emphasis where appropriate.
    Add emoji icons to section headers to make the summary more engaging.
    
    Here's the document content:
    ${trimmedText}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return summary;
  } catch (error: any) {
    console.error("Error generating summary:", error);
    
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    throw new Error(`Failed to generate summary: ${error.message || "Unknown error"}`);
  }
}

// Analyze image with Gemini Vision
export async function analyzeImageWithGemini(imageData: string) {
  console.log("Analyzing image with Gemini Vision");
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro-vision",
      safetySettings,
    });
    
    const prompt = `
    Analyze this image in detail. It is a snippet from an academic paper. 
    Describe what you see, including:
    1. Any text content visible
    2. Any figures, charts, or diagrams and what they represent
    3. Any tables and their key information
    4. Any mathematical formulas or equations
    
    If the image contains text, try to transcribe the important parts accurately.
    If there are complex visuals, explain what they are meant to demonstrate.
    
    Provide your analysis in a clear, structured format with markdown formatting.
    `;
    
    const result = await model.generateContentFromMultiModal({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: imageData.split(',')[1] } }
          ]
        }
      ]
    });
    
    const response = await result.response;
    const analysis = response.text();
    
    return analysis;
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    throw new Error(`Failed to analyze image: ${error.message || "Unknown error"}`);
  }
}

// Explain selected text from PDF
export async function explainSelectedText(selectedText: string) {
  console.log("Explaining selected text, length:", selectedText.length);
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });
    
    const prompt = `
    The following is a selected passage from an academic paper. Please provide a clear explanation of this text, including:
    1. What it means in simpler terms
    2. Any key concepts or terminology mentioned
    3. Why it might be important in the context of the paper
    
    Selected text:
    "${selectedText}"
    
    Provide your explanation in a clear, accessible format using markdown for structure.
    Add relevant emoji icons where appropriate to make the response more engaging.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();
    
    return explanation;
  } catch (error: any) {
    console.error("Error explaining text:", error);
    
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    throw new Error(`Failed to explain text: ${error.message || "Unknown error"}`);
  }
}
