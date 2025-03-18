
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
    throw new Error("Failed to initialize AI service. Please try again later.");
  }
};

// Helper function to extract and parse JSON from AI response
export const parseJsonResponse = (text: string): any => {
  try {
    // Find and extract JSON if it's surrounded by markdown code blocks or other text
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
    
    if (!jsonMatch) {
      console.error("No JSON pattern found in response:", text.substring(0, 500));
      throw new Error("The AI response did not contain valid JSON data");
    }
    
    const jsonString = jsonMatch[1].trim();
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      // If direct parsing fails, try to sanitize the string
      const cleanedJsonString = jsonString
        .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
      
      return JSON.parse(cleanedJsonString);
    }
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError, "Response text:", text.substring(0, 500));
    throw new Error("Failed to process AI response. The format was invalid.");
  }
};

// Store/retrieve PDF text from session storage
export const storePdfText = (pdfText: string) => {
  if (!pdfText || pdfText.trim() === '') {
    console.warn("Attempted to store empty PDF text");
    return;
  }
  
  try {
    sessionStorage.setItem('pdfText', pdfText);
    console.log("Stored PDF text in session storage, length:", pdfText.length);
  } catch (error) {
    console.error("Failed to store PDF text in session storage:", error);
    // Try to store a truncated version if the original is too large
    try {
      const truncatedText = pdfText.substring(0, 1000000); // ~1MB limit for sessionStorage
      sessionStorage.setItem('pdfText', truncatedText);
      console.log("Stored truncated PDF text in session storage, length:", truncatedText.length);
    } catch (truncateError) {
      console.error("Failed to store even truncated PDF text:", truncateError);
    }
  }
};

export const getPdfText = (): string => {
  const pdfText = sessionStorage.getItem('pdfText');
  if (!pdfText || pdfText.trim() === '') {
    console.error("No PDF text found in session storage");
    throw new Error("No PDF content available. Please upload a PDF first.");
  }
  return pdfText;
};

// Safely truncate PDF text to avoid exceeding token limits
export const truncatePdfText = (pdfText: string, maxLength: number = 15000): string => {
  if (!pdfText) return "";
  return pdfText.length <= maxLength ? pdfText : pdfText.slice(0, maxLength);
};
