
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Initialize Gemini client
export const initGeminiClient = () => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
    throw new Error("Failed to initialize AI service");
  }
};

// Helper function to extract and parse JSON from AI response
export const parseJsonResponse = (text: string): any => {
  try {
    // Find and extract JSON if it's surrounded by markdown code blocks or other text
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
    
    // Try to parse the JSON
    const jsonData = JSON.parse(jsonString);
    
    // Ensure all values are strings
    Object.keys(jsonData).forEach(key => {
      if (typeof jsonData[key] !== 'string') {
        jsonData[key] = String(jsonData[key] || '');
      }
    });
    
    return jsonData;
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError);
    throw new Error("Failed to process AI response. The format was invalid.");
  }
};

// Store/retrieve PDF text from session storage
export const storePdfText = (pdfText: string) => {
  try {
    if (!pdfText || pdfText.trim() === '') {
      console.warn("Attempted to store empty PDF text");
      return;
    }
    
    console.log("Storing PDF text, length:", pdfText.length);
    sessionStorage.setItem('pdfText', pdfText);
    
    // Also store it as pdfData for backward compatibility
    if (!sessionStorage.getItem('pdfData')) {
      sessionStorage.setItem('pdfData', pdfText);
    }
  } catch (error) {
    console.error("Error storing PDF text:", error);
    // Don't throw, just log the error
  }
};

export const getPdfText = (): string => {
  try {
    // Try to get from pdfText first
    let pdfText = sessionStorage.getItem('pdfText');
    
    // If not found, try alternative storage keys
    if (!pdfText || pdfText.trim() === '') {
      pdfText = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
    }
    
    if (!pdfText || pdfText.trim() === '') {
      console.error("No PDF content available in any storage location");
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
    console.log("Using PDF text from sessionStorage source, length:", pdfText.length, "characters");
    return pdfText;
  } catch (error) {
    console.error("Error retrieving PDF text:", error);
    throw new Error("Failed to access PDF content. Please try uploading again.");
  }
};

// Safely truncate PDF text to avoid exceeding token limits
export const truncatePdfText = (pdfText: string, maxLength: number = 15000): string => {
  try {
    console.log("Original PDF text length:", pdfText.length, "max allowed:", maxLength);
    
    if (!pdfText) {
      return '';
    }
    
    const truncated = pdfText.slice(0, maxLength);
    console.log("Truncated PDF text to", truncated.length, "characters for API call");
    return truncated;
  } catch (error) {
    console.error("Error truncating PDF text:", error);
    return pdfText.slice(0, 5000); // Fallback to a very conservative limit
  }
};
