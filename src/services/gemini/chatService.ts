
import { initGeminiClient, getPdfText, truncatePdfText } from "./baseService";

// Chat with Gemini about PDF content
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    let pdfText;
    try {
      pdfText = getPdfText();
    } catch (error) {
      return "I don't have access to the PDF content. Please make sure you've uploaded a PDF first.";
    }
    
    const model = initGeminiClient();
    
    // Use a history array to maintain context
    const prompt = `
    You are an AI research assistant chatting with a user about a PDF document. 
    The user has the following question or request: "${message}"
    
    Here's an excerpt from the document they're referring to (it may be truncated):
    ${truncatePdfText(pdfText)}
    
    Provide a helpful, concise, and accurate response based solely on the document content.
    If you can't answer based on the provided text, be honest about your limitations.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};
