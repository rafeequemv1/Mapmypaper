
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

let geminiApi: GoogleGenerativeAI | null = null;

function getGeminiApi() {
  if (geminiApi) return geminiApi;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "AIzaSyByH5uD5R_JsskvGu_sVZchnza4kFR5pnM") {
    console.error("⚠️ Invalid Gemini API Key. Please add your API key to .env file.");
    throw new Error("Invalid Gemini API Key. Please add your API key to .env file.");
  }
  
  geminiApi = new GoogleGenerativeAI(apiKey);
  return geminiApi;
}

function getGeminiGenerationConfig() {
  return {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
    safetySettings: [
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
    ],
  };
}

// Now let's improve the error handling in our API functions

export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    console.log("Generating mind map from text...");
    
    // Trim very long texts to avoid API limits
    const trimmedText = text.length > 100000 ? text.substring(0, 100000) + "..." : text;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Create a mind map structure from the following academic paper or document. 
    Format the output as JSON matching this exact structure:
    
    {
      "root": {
        "topic": "Main Title of the Document",
        "children": [
          {
            "topic": "Major Section/Topic 1",
            "children": [
              {
                "topic": "Sub-point 1.1",
                "children": []
              },
              {
                "topic": "Sub-point 1.2",
                "children": []
              }
            ]
          },
          {
            "topic": "Major Section/Topic 2",
            "children": []
          }
        ]
      }
    }
    
    Capture the document's hierarchical structure with the main title as the root node.
    Create 4-8 main branches for major sections/topics.
    Add 2-4 sub-branches under each main branch for key points.
    Add 0-3 sub-sub-branches where needed for deeper details.
    Use clear, concise language for node text (5-10 words max per node).
    Ensure the JSON is valid and properly nested.
    
    Here's the document text to analyze:
    
    ${trimmedText}
    
    Return ONLY the valid JSON object with no additional text.`;
    
    console.log("Sending prompt to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received response from Gemini API");
    
    // Extract just the JSON part from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the API response");
    }
    
    let jsonText = jsonMatch[0];
    try {
      // Parse and validate the JSON
      const parsedJson = JSON.parse(jsonText);
      console.log("Successfully parsed mind map JSON");
      return parsedJson;
    } catch (jsonError) {
      console.error("Error parsing JSON from API response:", jsonError);
      throw new Error("Failed to parse the mind map JSON structure");
    }
  } catch (error) {
    console.error("Error in generateMindMapFromText:", error);
    throw error;
  }
}

export async function chatWithGeminiAboutPdf(prompt: string): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const config = getGeminiGenerationConfig();
    
    console.log("Sending chat prompt to Gemini API:", prompt.substring(0, 100) + "...");
    
    const result = await model.generateContent(prompt, config);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received chat response from Gemini API");
    return text;
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
}

export async function analyzeImageWithGemini(imageBase64: string): Promise<string> {
  try {
    // Strip the data URL prefix if present
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
    
    console.log("Sending image to Gemini Vision API...");
    
    // Create image part from base64 data
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Assume JPEG, but could be dynamic
        },
      },
    ];
    
    // Combine text prompt with image
    const prompt = "Analyze this image from an academic document. Describe what you see in detail, explaining any charts, graphs, figures, diagrams, tables, or text visible. If it contains data visualization, interpret the findings.";
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received image analysis from Gemini API");
    return text;
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    throw error;
  }
}

export async function explainSelectedText(text: string): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const config = getGeminiGenerationConfig();
    
    const prompt = `
      The following is selected text from a research paper or academic document. 
      Please explain it clearly, using academically appropriate language.
      Break down complex concepts, define specialized terms, and highlight the key points.
      If appropriate, mention how this passage connects to broader academic context.
      
      Selected Text:
      "${text}"
    `;
    
    console.log("Sending explanation prompt to Gemini API");
    const result = await model.generateContent(prompt, config);
    const response = await result.response;
    
    console.log("Received explanation from Gemini API");
    return response.text();
  } catch (error) {
    console.error("Error in explainSelectedText:", error);
    throw error;
  }
}
