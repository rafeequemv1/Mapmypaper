
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Initialize Gemini client
export const initGeminiClient = () => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// Helper function to extract and parse JSON from AI response
export const parseJsonResponse = (text: string): any => {
  try {
    // Find and extract JSON if it's surrounded by markdown code blocks or other text
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError);
    throw new Error("Failed to process AI response. The format was invalid.");
  }
};

// Store/retrieve PDF text from session storage
export const storePdfText = (pdfText: string) => {
  sessionStorage.setItem('pdfText', pdfText);
};

export const getPdfText = (): string => {
  const pdfText = sessionStorage.getItem('pdfText');
  if (!pdfText || pdfText.trim() === '') {
    throw new Error("No PDF content available. Please upload a PDF first.");
  }
  return pdfText;
};

// Safely truncate PDF text to avoid exceeding token limits
export const truncatePdfText = (pdfText: string, maxLength: number = 15000): string => {
  return pdfText.slice(0, maxLength);
};
