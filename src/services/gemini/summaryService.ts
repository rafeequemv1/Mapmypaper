
import { initGeminiClient, getPdfText, parseJsonResponse, truncatePdfText } from "./baseService";

// Generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Get PDF text from session storage
    const pdfText = getPdfText();
    console.log("Successfully retrieved PDF text from session storage, length:", pdfText.length);
    
    // Initialize the Gemini model
    const model = initGeminiClient();
    
    // Define prompt for AI
    const prompt = `
    Analyze this academic document and create a structured summary with the following sections:
    
    1. Overview: A brief snapshot of the entire document (2-3 sentences)
    2. Key Findings: The main discoveries or conclusions (3-5 bullet points)
    3. Objectives: The stated goals of the research (2-3 bullet points)
    4. Methods: How the research was conducted (2-4 bullet points)
    5. Results: Significant outcomes and data (3-5 bullet points)
    6. Conclusions: Final interpretations and implications (2-3 bullet points)
    
    Format your response as a JSON object with these section names as keys and the content as values.
    Make sure all values are strings, not arrays or objects.
    Keep each section concise and focused on the most important information.
    If the document doesn't contain information for a specific section, provide a brief note explaining this.
    
    Document text:
    ${truncatePdfText(pdfText, 10000)}
    `;
    
    console.log("Sending request to Gemini API");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received response from Gemini API");
    console.log("Extracted text from response", text.substring(0, 100) + "...");
    
    // Parse JSON response
    const parsedData = parseJsonResponse(text);
    console.log("Successfully parsed JSON response");
    
    // Validate the response structure and ensure all values are strings
    console.log("Validating response structure");
    const sections = Object.keys(parsedData);
    console.log("Summary data received:", sections);
    
    // Ensure all values are strings
    const validatedData: Record<string, string> = {};
    for (const key of sections) {
      const value = parsedData[key];
      validatedData[key] = typeof value === 'string' ? value : String(value || '');
    }
    
    return validatedData;
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate summary");
  }
};
