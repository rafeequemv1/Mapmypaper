
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Initialize Gemini client
export const initGeminiClient = () => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      console.error("Missing API key");
      throw new Error("API key is missing or invalid");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
      }
    });
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
      
      try {
        return JSON.parse(cleanedJsonString);
      } catch (finalError) {
        console.error("Failed to parse JSON even after cleaning:", finalError);
        // Return a fallback object if parsing fails completely
        return {
          "Overview": "The AI generated a response, but it couldn't be formatted properly.",
          "Key Findings": "- We were unable to extract structured data from the AI response\n- The original text is available but not in the expected format",
          "Methods": "- The response format was invalid and could not be processed",
          "Results": "- No results could be extracted from the malformed response",
          "Conclusions": "Please try regenerating the summary to get a proper structured response."
        };
      }
    }
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError, "Response text:", text.substring(0, 500));
    throw new Error("Failed to process AI response. The format was invalid.");
  }
};

// Helper function to safely store data in sessionStorage
const safeSessionStorage = (key: string, data: string): boolean => {
  try {
    sessionStorage.setItem(key, data);
    return true;
  } catch (error) {
    console.warn(`Failed to store ${key} in sessionStorage:`, error);
    return false;
  }
};

// Improved storage with multiple fallbacks and size checks
export const storePdfText = (pdfText: string) => {
  if (!pdfText || pdfText.trim() === '') {
    console.warn("Attempted to store empty PDF text");
    return;
  }
  
  try {
    // First validate that we have PDF data
    const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
    if (!pdfData || pdfData.length < 100) {
      console.warn("Storing PDF text but no PDF data found in session storage");
    }
    
    // Try to store the full text first
    let storedSuccessfully = safeSessionStorage('pdfText', pdfText);
    if (storedSuccessfully) {
      console.log("Stored PDF text in session storage, length:", pdfText.length);
    } else {
      // If full storage fails, try storing a truncated version
      const maxLength = Math.min(500000, Math.floor(pdfText.length * 0.7)); // ~500KB or 70% of original
      const truncatedText = pdfText.substring(0, maxLength);
      storedSuccessfully = safeSessionStorage('pdfText', truncatedText);
      
      if (storedSuccessfully) {
        safeSessionStorage('isPdfTextTruncated', 'true');
        console.log("Stored truncated PDF text, length:", truncatedText.length);
      } else {
        // If all else fails, store a very small snippet
        const miniSnippet = pdfText.substring(0, 10000) + "\n\n[Content truncated due to size limitations]";
        safeSessionStorage('pdfText', miniSnippet);
        safeSessionStorage('isPdfTextTruncated', 'true');
        console.log("Stored minimal PDF text snippet");
      }
    }
  } catch (error) {
    console.error("Failed to store PDF text in session storage:", error);
    // Try a last-ditch minimal storage
    try {
      const fallbackText = "PDF content too large to store in browser memory. Limited analysis available.";
      sessionStorage.setItem('pdfText', fallbackText);
      sessionStorage.setItem('isPdfTextTruncated', 'true');
    } catch (fallbackError) {
      console.error("Complete failure to store even minimal text:", fallbackError);
    }
  }
};

// Improved PDF text retrieval with better fallbacks
export const getPdfText = (): string => {
  try {
    // First validate that we have PDF data before attempting to get text
    const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
    
    if (!pdfData || pdfData.length < 100) {
      console.error("No valid PDF data found in session storage when getting PDF text");
      
      // If there's no PDF data but there is text, we'll still return it with a warning
      const existingText = sessionStorage.getItem('pdfText');
      if (existingText && existingText.trim() !== '') {
        console.warn("Found PDF text but no PDF data, returning existing text with warning");
        return existingText + "\n\n[Note: The original PDF data is not available, analysis may be limited]";
      }
      
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
    // Next, try to get the extracted text
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (pdfText && pdfText.trim() !== '') {
      const isTruncated = sessionStorage.getItem('isPdfTextTruncated') === 'true';
      console.log(`Found PDF text in session storage, length: ${pdfText.length}, truncated: ${isTruncated}`);
      
      if (isTruncated) {
        return pdfText + "\n\n[Note: This is a truncated version of the document due to size limitations]";
      }
      
      return pdfText;
    } else {
      console.log("No PDF text found, but PDF data exists. Creating fallback text.");
      // If we have PDF data but no extracted text, create and store a fallback
      const fallbackText = "PDF text extraction incomplete. Limited analysis available based on PDF data.";
      sessionStorage.setItem('pdfText', fallbackText);
      return fallbackText;
    }
  } catch (error) {
    console.error("Error retrieving PDF text:", error);
    throw new Error("No PDF content available. Please upload a PDF first.");
  }
};

// Safely truncate PDF text to avoid exceeding token limits
export const truncatePdfText = (pdfText: string, maxLength: number = 15000): string => {
  if (!pdfText) return "";
  
  // Log before truncation
  console.log(`Original PDF text length: ${pdfText.length}, max allowed: ${maxLength}`);
  
  const truncatedText = pdfText.length <= maxLength ? pdfText : pdfText.slice(0, maxLength);
  
  // Log after truncation
  if (pdfText.length > maxLength) {
    console.log(`Text was truncated from ${pdfText.length} to ${truncatedText.length} characters`);
  }
  
  return truncatedText;
};
