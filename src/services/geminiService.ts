
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

// ADDING THE MISSING FUNCTIONS

// Function to chat with Gemini about a PDF
export async function chatWithGeminiAboutPdf(prompt: string) {
  console.log("Chatting with Gemini about PDF:", prompt.substring(0, 100) + "...");
  
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
    return response.text();
  } catch (error: any) {
    console.error("Error chatting with Gemini about PDF:", error);
    
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
    
    throw new Error(`Failed to chat with Gemini: ${error.message || "Unknown error"}`);
  }
}

// Function to analyze an image with Gemini Vision
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
    // Use Gemini-Pro-Vision model for image analysis
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro-vision",
      safetySettings,
    });
    
    const prompt = "Analyze this image and describe what you see in detail. If it contains text, please extract and summarize it. If it's a figure or diagram, explain what it represents.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.split(",")[1], // Remove the "data:image/jpeg;base64," part
          mimeType: "image/jpeg",
        },
      },
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error analyzing image with Gemini:", error);
    
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
    
    throw new Error(`Failed to analyze image: ${error.message || "Unknown error"}`);
  }
}

// Function to explain selected text
export async function explainSelectedText(text: string) {
  console.log("Explaining selected text:", text.substring(0, 100) + "...");
  
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
    Explain the following text in clear, simple language:
    
    "${text}"
    
    Include:
    1. Main concepts and terminology
    2. Key points in bullet points
    3. Simple analogies if appropriate
    4. Why this information matters in the broader context
    
    Format your response with markdown for better readability.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error explaining text with Gemini:", error);
    
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
    
    throw new Error(`Failed to explain text: ${error.message || "Unknown error"}`);
  }
}

// Function to generate a structured summary
export async function generateStructuredSummary(pdfText: string) {
  console.log("Generating structured summary from text of length:", pdfText.length);
  
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
    const trimmedText = pdfText.length > MAX_TEXT_LENGTH 
      ? pdfText.substring(0, MAX_TEXT_LENGTH) + "... [TRUNCATED]" 
      : pdfText;
    
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });
    
    const prompt = `
    Create a comprehensive structured summary of the following academic text.
    Format your response using markdown with clear headings.
    
    Include the following sections:
    1. OVERVIEW - A brief overview of the document (2-3 sentences)
    2. KEY FINDINGS - The main results or conclusions (3-5 bullet points)
    3. METHODOLOGY - How the research was conducted (if applicable)
    4. IMPLICATIONS - The significance of the work
    5. LIMITATIONS - Any limitations mentioned or implied
    
    Make your summary informative yet concise. Add relevant emojis at the start of each section.
    
    Here's the text:
    ${trimmedText}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error generating structured summary:", error);
    
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
    
    throw new Error(`Failed to generate summary: ${error.message || "Unknown error"}`);
  }
}
