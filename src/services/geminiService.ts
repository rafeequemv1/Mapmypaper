import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Google Generative AI with the API key
// Use import.meta.env instead of process.env for Vite
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "");

// Get the model (using Gemini Pro)
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro", 
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 1,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Chat model for streaming responses
const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-pro", 
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.7,
    topP: 1,
  },
});

const mindmapPrompt = (text: string) => `
Analyze the following text from a research paper and extract the key concepts, ideas, and relationships.
Create a mind map diagram in Mermaid syntax that visually represents these elements.
The root node should be the main topic of the paper, and the subsequent levels should branch out to subtopics, supporting ideas, and relevant details.
Use clear and concise labels for each node, and ensure that the connections between nodes accurately reflect the relationships in the text.
Incorporate citations where appropriate.
Text:
${text}
`;

const treemapPrompt = (text: string) => `
Analyze the following text from a research paper and extract the key themes, categories, and their relative importance.
Create a treemap diagram in Mermaid syntax that visually represents these elements.
The size of each rectangle in the treemap should correspond to the weight or importance of the theme/category in the paper.
Use clear and concise labels for each rectangle, and ensure that the hierarchy and sizing accurately reflect the information in the text.
Incorporate citations where appropriate.
Text:
${text}
`;

// Get PDF text from session storage
const getPdfTextFromStorage = (): string => {
  return sessionStorage.getItem('pdfText') || "";
};

export async function generateMermaidDiagram(type: string, text: string) {
  let prompt = "";
  if (type === "mindmap") {
    prompt = mindmapPrompt(text);
  } else if (type === "treemap") {
    prompt = treemapPrompt(text);
  } else {
    throw new Error(`Invalid visualization type: ${type}`);
  }
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fullText = response.text();
    
    // Check if the response contains the code block delimiters
    const startDelimiter = "```mermaid";
    const endDelimiter = "```";
    
    const startIndex = fullText.indexOf(startDelimiter);
    const endIndex = fullText.indexOf(endDelimiter, startIndex + startDelimiter.length);
    
    if (startIndex !== -1 && endIndex !== -1) {
      // Extract the Mermaid code from the response
      const mermaidCode = fullText.substring(startIndex + startDelimiter.length, endIndex).trim();
      return mermaidCode;
    } else {
      // If delimiters are not found, return the full text as is
      console.warn("Mermaid code delimiters not found in the response.");
      return fullText.trim();
    }
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
}

// Chat with Gemini about the PDF content
export async function chatWithGeminiAboutPdf(userMessage: string): Promise<string> {
  try {
    // Get PDF text from session storage
    const pdfText = getPdfTextFromStorage();
    
    // If PDF text is not available, return a friendly message
    if (!pdfText) {
      return "I don't have any PDF content to reference. Please upload a PDF document first.";
    }
    
    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a research assistant helping me understand a scientific paper. The paper content is provided below. Always answer questions about this paper with detailed, academic explanations and use specific page citations in [citation:pageX] format when referring to content." }],
        },
        {
          role: "model",
          parts: [{ text: "I'll help you understand the scientific paper. I'll provide detailed explanations with page citations in [citation:pageX] format when referring to specific content." }],
        },
        {
          role: "user",
          parts: [{ text: `Here is the content of the paper: "${pdfText.substring(0, 25000)}"` }],
        },
        {
          role: "model",
          parts: [{ text: "I've received the paper content. What would you like to know about it?" }],
        },
      ],
    });

    // Send the user's message and get a response
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    throw error;
  }
}

// Analyze image with Gemini
export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  try {
    // Get PDF text for context
    const pdfText = getPdfTextFromStorage();
    const contextPrompt = pdfText ? 
      `This image is from a scientific paper. Here's some context from the paper: "${pdfText.substring(0, 1000)}..."` : 
      "This image is from a scientific paper.";
    
    // Set up a model that can handle images
    const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Process the imageData - it should be a base64 string
    const imageBytes = imageData.split(',')[1];
    
    // Create a multipart prompt with the image and context
    const result = await visionModel.generateContent([
      contextPrompt,
      {
        inlineData: {
          data: imageBytes,
          mimeType: "image/jpeg", // Assuming JPEG, but could be PNG
        },
      },
      "Analyze this image in detail. If it contains figures, charts, or diagrams, explain what they represent. If there's text, summarize the key information. Provide academic explanations with emojis where relevant.",
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}

// Generate structured summary
export async function generateStructuredSummary(): Promise<Record<string, string>> {
  try {
    // Get PDF text from session storage
    const pdfText = getPdfTextFromStorage();
    
    // If PDF text is not available, return a default response
    if (!pdfText) {
      return {
        "Summary": "No PDF content available. Please upload a PDF document first.",
        "Key Findings": "Not available",
        "Objectives": "Not available",
        "Methods": "Not available",
        "Results": "Not available",
        "Conclusions": "Not available",
        "Key Concepts": "Not available",
      };
    }
    
    // Craft a prompt for structured summary
    const prompt = `
    Create a comprehensive structured summary of the following academic paper. 
    Format your response as a JSON object with the following keys:
    - Summary: A concise overview of the entire paper
    - Key Findings: The main discoveries or conclusions
    - Objectives: The stated goals or research questions
    - Methods: The approaches or techniques used
    - Results: The outcomes of the research
    - Conclusions: The implications and importance of the findings
    - Key Concepts: The fundamental ideas or theories discussed
    
    For each section, provide detailed information with specific page citations in [citation:pageX] format. 
    Use emoji icons where relevant to make the content more engaging. Make sure the response is formatted as valid JSON.
    
    Paper content:
    ${pdfText.substring(0, 30000)}
    `;
    
    // Send the prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const cleanedJson = jsonString.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      
      const summary = JSON.parse(cleanedJson);
      return summary;
    } catch (jsonError) {
      console.error("Error parsing JSON from Gemini response:", jsonError);
      
      // Fallback: Create a structured response manually
      return {
        "Summary": text.slice(0, 500) + "...",
        "Key Findings": "Error parsing response. Please try again.",
        "Objectives": "Error parsing response. Please try again.",
        "Methods": "Error parsing response. Please try again.",
        "Results": "Error parsing response. Please try again.",
        "Conclusions": "Error parsing response. Please try again.",
        "Key Concepts": "Error parsing response. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw error;
  }
}

export async function generateMindMapFromText(text: string) {
  const mindMapData = {
    "format": "mindmap",
    "theme": "fresh-blue",
    "author": "mapmypaper",
    "version": "1.4.4",
    "root": {
      "id": "root",
      "topic": "Main Topic",
      "style": {
        "background": "#13795A",
        "color": "white"
      },
      "children": [
        {
          "id": "1",
          "topic": "Subtopic 1",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        },
        {
          "id": "2",
          "topic": "Subtopic 2",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        },
        {
          "id": "3",
          "topic": "Subtopic 3",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        }
      ]
    }
  };
  
  return mindMapData;
}
