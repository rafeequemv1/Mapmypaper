
import { initGeminiClient, getPdfText, parseJsonResponse, truncatePdfText } from "./baseService";

// Generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Attempt to get PDF text, will throw error if not available
    let pdfText = "";
    try {
      pdfText = getPdfText();
    } catch (error) {
      // If getPdfText() fails, try to get PDF data directly from sessionStorage
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      if (!pdfData) {
        throw new Error("No PDF content available. Please upload a PDF first.");
      }
      // If we have PDF data but no extracted text, use a simpler prompt
      pdfText = "PDF text extraction incomplete. Using simplified analysis.";
      // Store it so next time getPdfText() works
      sessionStorage.setItem('pdfText', pdfText);
    }
    
    // If there's no PDF text to analyze, throw an error
    if (!pdfText || pdfText.trim() === '') {
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
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
    
    Use proper formatting with markdown:
    - Use headings with # for important section subtitles
    - Format bullet points with - at the start of lines
    - Use paragraphs separated by blank lines
    
    Document text:
    ${truncatePdfText(pdfText, 10000)}
    `;
    
    // Set a timeout to prevent the request from hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out. Please try again.")), 60000);
    });
    
    // Create a promise for the Gemini API call
    const apiPromise = model.generateContent(prompt)
      .then(result => result.response)
      .then(response => response.text())
      .then(text => parseJsonResponse(text));
    
    // Race the API call against the timeout
    const result = await Promise.race([apiPromise, timeoutPromise]) as Record<string, string>;
    
    // Validate the response structure
    const requiredSections = ["Overview", "Key Findings", "Methods", "Results", "Conclusions"];
    const missingSections = requiredSections.filter(section => !result[section]);
    
    if (missingSections.length > 0) {
      console.warn("Some expected sections are missing in the response:", missingSections);
      // Add placeholders for missing sections
      missingSections.forEach(section => {
        result[section] = `No information about ${section.toLowerCase()} was found in the document.`;
      });
    }
    
    return result;
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    // Re-throw with a more user-friendly message
    throw new Error(
      error instanceof Error 
        ? `Error generating summary: ${error.message}` 
        : "Failed to generate summary. Please try again later."
    );
  }
};
