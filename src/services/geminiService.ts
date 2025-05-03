
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

// Chat with Gemini about a PDF
export async function chatWithGeminiAboutPdf(question: string) {
  console.log("Chatting with Gemini about PDF with question:", question);
  
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
    You are a research assistant helping with a PDF document. Answer the following question 
    based on the PDF content. If you don't know the answer, say so politely. Use markdown
    formatting for better readability. When referencing specific content from the document,
    provide page citations in the format [citation:page1] where the number indicates the page.
    Add relevant emojis to make your response more engaging.
    
    Question:
    ${question}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received response from Gemini API");
    
    return responseText;
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
    
    // Default error with more information
    throw new Error(`Failed to chat with Gemini: ${error.message || "Unknown error"}`);
  }
}

// Explain selected text
export async function explainSelectedText(selectedText: string) {
  console.log("Explaining selected text of length:", selectedText.length);
  
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
    Please explain this text in detail. Use complete sentences with relevant emojis and provide specific 
    page citations in [citation:pageX] format: "${selectedText}". Add emojis relevant to the content.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received explanation from Gemini API");
    
    return responseText;
  } catch (error: any) {
    console.error("Error explaining text with Gemini:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    throw new Error(`Failed to explain text: ${error.message || "Unknown error"}`);
  }
}

// Generate structured summary
export async function generateStructuredSummary(pdfText: string) {
  console.log("Generating structured summary of text length:", pdfText.length);
  
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
    Create a structured summary of the following academic text.
    Identify the document type (research paper, technical document, legal document, etc.) and format your summary accordingly.
    Always include a "Summary" section and 4-6 other relevant sections based on the document type.
    For academic papers, include sections like "Key Findings", "Methods", "Contributions", "Implications".
    For technical documents, include sections like "Requirements", "Implementation", "Technical Details".
    For each part, provide specific page citations in [citation:pageX] format where relevant.
    Use complete sentences and add relevant emojis for better engagement.
    
    Return your response as a JSON object with section names as keys and section content as values:
    
    {
      "Summary": "Overall summary of the document... [citation:page1]",
      "Key Findings": "The main findings are... [citation:page3]",
      "Methods": "The authors used... [citation:page2]",
      ...
    }
    
    Here's the text to analyze:
    ${trimmedText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received structured summary from Gemini API");
    
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
      const summaryData = JSON.parse(jsonStr);
      console.log("Successfully parsed structured summary data");
      return summaryData;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.error("Raw response:", jsonStr);
      // Fall back to returning the raw text if JSON parsing fails
      return { "Summary": responseText };
    }
  } catch (error: any) {
    console.error("Error generating structured summary:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    // Default error with more information
    throw new Error(`Failed to generate summary: ${error.message || "Unknown error"}`);
  }
}

// Analyze image with Gemini Vision
export async function analyzeImageWithGemini(imageBase64: string) {
  console.log("Analyzing image with Gemini Vision API");
  
  // Re-initialize API if needed
  if (!genAI) {
    const initialized = initializeGeminiAPI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API");
    }
  }
  
  try {
    // Get the Gemini Pro Vision model
    const model = genAI!.getGenerativeModel({
      model: "gemini-pro-vision", // Use the vision-capable model
      safetySettings,
    });

    // Format the prompt with the image
    const prompt = "Please analyze and describe this image in detail. If it contains text, include that text in your response. If it's a chart, diagram or graph, explain what it's showing.";
    
    // Need to create parts array for multimodal input
    const parts = [
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } }
    ];
    
    // Generate content with image
    const result = await model.generateContent(parts);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received image analysis from Gemini Vision API");
    
    return responseText;
  } catch (error: any) {
    console.error("Error analyzing image with Gemini:", error);
    
    // Check for common API errors
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API rate limit exceeded. Please try again in a few minutes.");
    }
    
    throw new Error(`Failed to analyze image: ${error.message || "Unknown error"}`);
  }
}
