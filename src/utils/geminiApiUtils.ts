
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with an API key
let genAI: GoogleGenerativeAI;

// Initialize with API key from environment variable
function initializeGenAI() {
  // Try to get API key from environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("Missing Gemini API key. Please set the VITE_GEMINI_API_KEY environment variable.");
    return false;
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return true;
  } catch (error) {
    console.error("Error initializing Gemini API:", error);
    return false;
  }
}

// Function to call Gemini API with options
export async function callGeminiAPI(
  prompt: string, 
  options: {
    maxTokens?: number;
    image?: string;
  } = {}
): Promise<string> {
  // Initialize if not already done
  if (!genAI) {
    const initialized = initializeGenAI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API. Check your API key.");
    }
  }

  try {
    // Select the model based on whether we have an image
    const modelName = options.image ? "gemini-pro-vision" : "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prepare content parts
    const contentParts: any[] = [{ text: prompt }];
    
    // Add image if provided
    if (options.image) {
      contentParts.push({
        inlineData: {
          data: options.image.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: "image/jpeg", // Adjust based on actual image type if needed
        }
      });
    }
    
    // Configure generation options
    const generationConfig = {
      maxOutputTokens: options.maxTokens || 8192, // Default to 8k tokens or user specified
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
    };

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: contentParts }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // For rate limiting errors, add specific message
    if (
      error instanceof Error && 
      (error.message.includes("429") || error.message.includes("quota") || error.message.includes("rate limit"))
    ) {
      throw new Error("Gemini API rate limit exceeded. Please try again later.");
    }
    
    throw error;
  }
}
