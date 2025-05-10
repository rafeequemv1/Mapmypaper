
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with an API key
let genAI: GoogleGenerativeAI;

// API key provided directly as fallback
const FALLBACK_API_KEY = "AIzaSyDAP3BAK_l68qBG9-m-Ur_Ob46HteCafJk";

// Current Gemini models (as of May 2025)
const TEXT_MODEL = "gemini-1.5-pro"; // Updated from gemini-pro
const MULTIMODAL_MODEL = "gemini-1.5-pro-vision"; // Updated from gemini-pro-vision

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

// Initialize with API key from environment variable or fallback
function initializeGenAI() {
  // Try to get API key from environment or use fallback
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_API_KEY;
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return true;
  } catch (error) {
    console.error("Error initializing Gemini API:", error);
    return false;
  }
}

// Helper function to handle exponential backoff for retries
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to call Gemini API with automatic retries
export async function callGeminiAPI(
  prompt: string, 
  options: {
    maxTokens?: number;
    image?: string;
    retryAttempt?: number;
  } = {}
): Promise<string> {
  // Set default retry attempt if not provided
  const retryAttempt = options.retryAttempt || 0;
  
  // Initialize if not already done
  if (!genAI) {
    const initialized = initializeGenAI();
    if (!initialized) {
      throw new Error("Failed to initialize Gemini API. Check your API key.");
    }
  }

  try {
    // Select the model based on whether we have an image
    const modelName = options.image ? MULTIMODAL_MODEL : TEXT_MODEL;
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
    console.error(`Error calling Gemini API (attempt ${retryAttempt + 1}):`, error);
    
    // Check for rate limiting errors
    const isRateLimit = error instanceof Error && (
      error.message.includes("429") || 
      error.message.includes("quota") || 
      error.message.includes("rate limit")
    );
    
    // Check for model not found errors
    const isModelNotFound = error instanceof Error && 
      error.message.includes("404") && 
      error.message.includes("models");
    
    // Handle retries for rate limiting
    if (isRateLimit && retryAttempt < MAX_RETRIES) {
      // Calculate exponential backoff delay
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt);
      console.log(`Rate limit exceeded. Retrying in ${delay/1000} seconds (attempt ${retryAttempt + 1} of ${MAX_RETRIES})...`);
      
      // Wait for the calculated delay
      await sleep(delay);
      
      // Retry with incremented attempt counter
      return callGeminiAPI(prompt, {
        ...options,
        retryAttempt: retryAttempt + 1
      });
    }
    
    // Handle specific error cases with user-friendly messages
    if (isRateLimit) {
      throw new Error(`Gemini API rate limit exceeded after ${MAX_RETRIES} retries. Please try again in a few minutes.`);
    } else if (isModelNotFound) {
      throw new Error("The specified Gemini model is not available. This could be due to API changes or region restrictions.");
    }
    
    // Handle general errors
    throw error;
  }
}
