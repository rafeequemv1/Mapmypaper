
import { initGeminiClient, getPdfText, parseJsonResponse, truncatePdfText } from "./baseService";

// Generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    const pdfText = getPdfText();
    
    const model = initGeminiClient();
    
    const prompt = `
    Analyze this academic document and create a structured summary with the following sections:
    
    1. Overview: A brief snapshot of the entire document (2-3 sentences)
    2. Key Findings: The main discoveries or conclusions (3-5 bullet points)
    3. Objectives: The stated goals of the research (2-3 bullet points)
    4. Methods: How the research was conducted (2-4 bullet points)
    5. Results: Significant outcomes and data (3-5 bullet points)
    6. Conclusions: Final interpretations and implications (2-3 bullet points)
    
    Format your response as a JSON object with these section names as keys and the content as values.
    Keep each section concise and focused on the most important information.
    If the document doesn't contain information for a specific section, provide a brief note explaining this.
    
    Document text:
    ${truncatePdfText(pdfText)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return parseJsonResponse(text);
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    throw error;
  }
};
