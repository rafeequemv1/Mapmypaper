
import { GoogleGenerativeAI, GenerativeModel, EnhancedGenerateContentResponse } from "@google/generative-ai";

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Initialize the Google Generative AI with API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Cache for PDF content to avoid repeated extraction
let cachedPdfContent: string | null = null;

/**
 * Generate a mind map from the provided text content
 */
export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    // Cache the PDF content for subsequent requests
    cachedPdfContent = text;

    // Initialize the generative model for text
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct the prompt for mind map generation
    const prompt = `
      Act as an expert academic researcher. I want you to create a structured mind map from this academic paper. 
      The structure should be in JSON format with the following:
      
      1. A central topic (the main subject of the paper)
      2. Main branches (key sections/topics)
      3. Sub-branches for each main branch (subtopics, details, examples)
      
      Create a JSON structure like this:
      {
        "centralTopic": "Paper Title",
        "branches": [
          {
            "topic": "Main Topic 1",
            "children": [
              {"topic": "Subtopic 1.1"},
              {"topic": "Subtopic 1.2", "children": [{"topic": "Detail 1.2.1"}, {"topic": "Detail 1.2.2"}]}
            ]
          },
          {
            "topic": "Main Topic 2",
            "children": [
              {"topic": "Subtopic 2.1"},
              {"topic": "Subtopic 2.2"}
            ]
          }
        ]
      }
      
      Important:
      - Focus on the most important topics and findings
      - Maintain hierarchical relationships
      - Include only text in the JSON structure
      - Only respond with the JSON object, no additional text or explanation
      
      Here is the academic paper:
      ${text.substring(0, 15000)}
    `;

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Extract JSON from the response
    let jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to generate a valid mind map structure");
    }

    // Parse the JSON structure
    const mindMapData = JSON.parse(jsonMatch[0]);
    return mindMapData;
  } catch (error: any) {
    console.error("Error generating mind map:", error);
    throw new Error(`Failed to generate mind map: ${error.message}`);
  }
}

/**
 * Chat with Gemini about the PDF content
 */
export async function chatWithGeminiAboutPdf(prompt: string): Promise<string> {
  try {
    // Initialize the generative model for text
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Combine the prompt with cached PDF content if available
    let fullPrompt = prompt;
    if (cachedPdfContent) {
      fullPrompt = `
        I want you to answer questions about the following document.
        My question is: "${prompt}"
        
        Here is the document (excerpt):
        ${cachedPdfContent.substring(0, 15000)}
      `;
    }

    // Generate content based on the prompt
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error chatting with Gemini about PDF:", error);
    throw new Error(`Failed to get response: ${error.message}`);
  }
}

/**
 * Explain selected text from the PDF
 */
export async function explainSelectedText(text: string): Promise<string> {
  try {
    // Initialize the generative model for text
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct the prompt for explanation
    const prompt = `
      The following text is from an academic paper. Please explain it in simpler terms, 
      clarify its meaning, and highlight any important concepts mentioned:
      
      "${text}"
      
      Please format your response with markdown for better readability. Include emojis where appropriate.
    `;

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error explaining selected text:", error);
    throw new Error(`Failed to explain text: ${error.message}`);
  }
}

/**
 * Analyze an image with Gemini Vision
 */
export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  try {
    // Initialize the generative model for multi-modal (text+image)
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Parse the image data
    const imageDataParts = imageData.split(",");
    if (imageDataParts.length !== 2) {
      throw new Error("Invalid image data format");
    }
    
    const mimeType = imageDataParts[0].split(":")[1].split(";")[0];
    const imageBase64 = imageDataParts[1];
    
    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    };
    
    // Construct the prompt
    const prompt = `
      Analyze this image and describe what you see. If the image contains text, 
      diagrams, charts, or any academic content, explain what it's showing in detail.
    `;
    
    // Generate content based on the prompt and image
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Generate a structured summary of the document
 */
export async function generateStructuredSummary(prompt: string): Promise<string> {
  try {
    // Initialize the generative model for text
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Combine the prompt with cached PDF content if available
    let fullPrompt = prompt;
    if (cachedPdfContent) {
      fullPrompt = `
        Create a structured academic summary of this document with the following sections:
        
        1. Overview
        2. Key Findings
        3. Methodology
        4. Results
        5. Limitations
        6. Conclusions
        
        Format your response using markdown with headers. 
        Be concise but comprehensive. Include page citations in [citation:pageX] format.
        
        Here is the document:
        ${cachedPdfContent.substring(0, 15000)}
      `;
    }

    // Generate content based on the prompt
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

/**
 * Generate a flowchart diagram from text
 */
export async function generateFlowchartFromText(text: string): Promise<string> {
  try {
    // Initialize the generative model for text
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct the prompt for flowchart generation
    const prompt = `
      Create a Mermaid.js flowchart diagram based on the following content from an academic paper:
      
      ${text.substring(0, 5000)}
      
      The diagram should:
      1. Visualize the key processes, steps, or relationships
      2. Be clear and well-structured
      3. Use proper Mermaid.js flowchart syntax
      4. Include only the essential elements
      
      Return ONLY the Mermaid code wrapped in triple backticks with the mermaid tag, like:
      \`\`\`mermaid
      flowchart TD
        A[Start] --> B[Process]
        B --> C[End]
      \`\`\`
    `;

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Extract Mermaid code from response
    const mermaidMatch = textResponse.match(/```mermaid([\s\S]*?)```/);
    if (!mermaidMatch || !mermaidMatch[1]) {
      throw new Error("Failed to generate a valid Mermaid diagram");
    }

    return mermaidMatch[1].trim();
  } catch (error: any) {
    console.error("Error generating flowchart:", error);
    throw new Error(`Failed to generate flowchart: ${error.message}`);
  }
}
