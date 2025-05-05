
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getPdfText, getAllPdfText } from "@/utils/pdfStorage";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Set up the model configuration with safety settings
const generationConfig = {
  temperature: 0.7,
  topK: 32,
  topP: 0.95,
  maxOutputTokens: 4096,
};

// Safety settings to prevent harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Create a Gemini model instance
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig,
  safetySettings,
});

// Create a Gemini Vision model for image analysis
const visionModel = genAI.getGenerativeModel({
  model: "gemini-pro-vision",
  generationConfig,
  safetySettings,
});

// Function to generate a mind map based on PDF text
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Define a system prompt that explains how to create a mind map
    const systemPrompt = `
      You are an expert in creating mind maps. Create a comprehensive mind map for the provided document text.
      
      Format the mind map as a JSON structure with the following format:
      {
        "root": {
          "topic": "Main Topic",
          "children": [
            {
              "topic": "Subtopic 1",
              "children": [
                { "topic": "Detail 1.1" },
                { "topic": "Detail 1.2" }
              ]
            },
            {
              "topic": "Subtopic 2",
              "children": [
                { "topic": "Detail 2.1" },
                { "topic": "Detail 2.2" }
              ]
            }
          ]
        }
      }
      
      The mind map should:
      1. Identify the main topic and key subtopics
      2. Include important details under each subtopic
      3. Present a balanced structure with 4-6 main branches
      4. Each branch should have 2-5 subnodes
      5. Keep node text concise (1-5 words per node)
      6. Include only the most important information
      
      Return only the JSON object without additional explanation.
    `;

    const prompt = `
      ${systemPrompt}
      
      Document text:
      ${pdfText.substring(0, 25000)}
      
      Generate a mind map representation in the JSON format described above.
    `;

    // Generate the mind map structure
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract the JSON part of the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const mindMapData = JSON.parse(jsonMatch[0]);
        return mindMapData;
      } catch (error) {
        console.error("Error parsing mind map JSON:", error);
        throw new Error("Failed to parse mind map data");
      }
    } else {
      throw new Error("Could not extract mind map data from response");
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw error;
  }
};

// Generate a structured summary of the PDF document
export const generateStructuredSummary = async (): Promise<any> => {
  try {
    // Get the PDF text from the current active PDF
    const currentPdf = sessionStorage.getItem('pdfText') || "";
    
    if (!currentPdf) {
      throw new Error("No PDF text available to summarize");
    }

    // Create a prompt for structured summary generation
    const prompt = `
      Analyze the following academic paper or document and provide a comprehensive structured summary.
      Use the following format, providing detailed information for each section:
      
      {
        "Summary": "A concise 3-5 sentence overview of the entire document",
        "Key Findings": "The main discoveries or conclusions",
        "Objectives": "What the document aims to accomplish",
        "Methods": "How the research or analysis was conducted",
        "Results": "The outcomes of the research or analysis",
        "Conclusions": "Final interpretations and implications",
        "Key Concepts": "Important terminology or ideas central to understanding the document"
      }
      
      Document text:
      ${currentPdf.substring(0, 30000)}
      
      Respond with ONLY the JSON object. Include appropriate page citations for important information using the format [citation:pageX] where X is the page number if you can determine it.
    `;

    // Generate the structured summary
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract the JSON part of the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const summaryData = JSON.parse(jsonMatch[0]);
        console.log("Generated summary:", summaryData);
        return summaryData;
      } catch (error) {
        console.error("Error parsing summary JSON:", error);
        throw new Error("Failed to parse summary data");
      }
    } else {
      throw new Error("Could not extract summary data from response");
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw error;
  }
};

// Modified function to support specific PDF or all PDFs as context
export const chatWithGeminiAboutPdf = async (
  prompt: string, 
  useAllPdfs: boolean = false,
  activePdfKey: string | null = null
): Promise<string> => {
  try {
    // Get PDF text based on mode: active PDF or all PDFs
    let pdfContext = "";
    
    if (useAllPdfs) {
      // Use all available PDFs as context
      const allPdfTexts = getAllPdfText();
      pdfContext = allPdfTexts.join("\n\n=== NEW DOCUMENT ===\n\n");
    } else if (activePdfKey) {
      // Use the active PDF as context
      const activePdfText = getPdfText(activePdfKey);
      if (activePdfText) {
        pdfContext = activePdfText;
      } else {
        // Fallback to session storage for backward compatibility
        pdfContext = sessionStorage.getItem('pdfText') || "";
      }
    } else {
      // Fallback to session storage for backward compatibility
      pdfContext = sessionStorage.getItem('pdfText') || "";
    }

    if (!pdfContext) {
      return "I don't have any PDF content to analyze. Please upload a PDF document first.";
    }

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `You are a research assistant helping me understand the following PDF document. 
                    I will be asking you questions about it. When citing content, use the format [citation:pageX] where X is the page number.
                    Be concise, accurate, and helpful. Use emojis when appropriate to make your answers more engaging.
                    
                    Here is the document content to analyze:
                    
                    ${pdfContext.substring(0, 100000)}`
            }
          ]
        },
        {
          role: "model",
          parts: [
            {
              text: "I've analyzed the document and I'm ready to answer your questions. I'll use citations in the format [citation:pageX] to help you locate information in the document."
            }
          ]
        }
      ],
      generationConfig: {
        ...generationConfig,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
};

// Process and analyze images using Gemini Vision
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Document text is optional context - we can use the active PDF text if available
    let pdfContext = sessionStorage.getItem('pdfText') || "";
    const pdfContextExcerpt = pdfContext.substring(0, 5000); // Just use a small excerpt for context

    // Create parts array for the request
    const imagePart = {
      inlineData: {
        data: imageData.split(",")[1], // Remove the data URL prefix
        mimeType: "image/png", // Assuming PNG format, adjust if needed
      }
    };
    
    const textPart = {
      text: `This image is from a document I'm analyzing. Please describe what you see in this image in detail.
            If there's text visible in the image, include that in your analysis.
            If relevant, here's some context from the document:
            ${pdfContextExcerpt}`
    };

    // Fixed format for Gemini API
    const result = await visionModel.generateContent([imagePart, textPart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
};

// Analyze file content using Gemini
export const analyzeFileWithGemini = async (
  fileContent: string,
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    // Trim file content if it's too large
    const trimmedContent = fileContent.length > 100000 
      ? fileContent.substring(0, 100000) + "... [content truncated due to size]" 
      : fileContent;
    
    const prompt = `
      Analyze the following file:
      Filename: ${fileName}
      File type: ${fileType}
      
      File content:
      ${trimmedContent}
      
      Please provide:
      1. A summary of what this file contains
      2. Key information or insights from this file
      3. Any patterns or trends visible in the data
      4. Suggestions for how this information might relate to the PDF document I've been asking about
      
      Be detailed and specific in your analysis.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing file with Gemini:", error);
    throw error;
  }
};
