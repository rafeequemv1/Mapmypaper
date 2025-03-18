
import { initGeminiClient, getPdfText, parseJsonResponse, truncatePdfText } from "./baseService";

// Generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Initialize placeholder for PDF text
    let pdfText = "";
    let textSource = "unknown";
    
    try {
      // First try the normal method of getting PDF text
      pdfText = getPdfText();
      textSource = "sessionStorage";
    } catch (error) {
      console.log("Could not get PDF text from session storage, trying alternative sources");
      
      // If that fails, try getting PDF data directly
      const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
      
      if (!pdfData) {
        console.error("No PDF data available in any storage location");
        throw new Error("No PDF content available. Please upload a PDF first.");
      }
      
      // Check length of PDF data to make sure it's not empty
      if (pdfData.length < 100) {
        console.error("PDF data found but it appears to be invalid (too small)");
        throw new Error("The PDF data appears to be invalid. Please try uploading the PDF again.");
      }
      
      // Set a simple fallback text if we have PDF data but no text
      pdfText = "PDF text extraction was incomplete. Using simplified analysis.";
      textSource = "fallback";
      
      // Try to retrieve any text that might be associated with the PDF
      const possibleText = sessionStorage.getItem('pdfText');
      if (possibleText && possibleText.length > 100) {
        pdfText = possibleText;
        textSource = "recovered";
      }
    }
    
    // If there's still no PDF text to analyze, throw an error
    if (!pdfText || pdfText.trim() === '') {
      console.error("No PDF text content to analyze");
      throw new Error("No PDF content available to analyze. Please upload a PDF first.");
    }
    
    console.log(`Using PDF text from ${textSource} source, length: ${pdfText.length} characters`);
    
    const model = initGeminiClient();
    
    // Truncate the PDF text to a safe length to prevent token limit issues
    const safeText = truncatePdfText(pdfText, 10000);
    console.log(`Truncated PDF text to ${safeText.length} characters for API call`);
    
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
    Use proper markdown formatting for your bullet points, headings, and emphasis.
    If the document doesn't contain information for a specific section, provide a brief note explaining this.
    
    Document text:
    ${safeText}
    `;
    
    // Create a promise for the Gemini API call
    console.log("Sending request to Gemini API");
    
    // Set a timeout to prevent the request from hanging indefinitely (60 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 60 seconds. Please try again.")), 60000);
    });
    
    // Make the API call
    const apiPromise = model.generateContent(prompt)
      .then(result => {
        console.log("Received response from Gemini API");
        return result.response;
      })
      .then(response => {
        const responseText = response.text();
        console.log("Extracted text from response", responseText.substring(0, 100) + "...");
        return responseText;
      })
      .then(text => {
        const parsedData = parseJsonResponse(text);
        console.log("Successfully parsed JSON response");
        return parsedData;
      });
    
    // Race the API call against the timeout
    const result = await Promise.race([apiPromise, timeoutPromise]) as Record<string, string>;
    
    // Validate the response structure
    console.log("Validating response structure");
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
    const errorMessage = error instanceof Error 
      ? `Error generating summary: ${error.message}` 
      : "Failed to generate summary. Please try again later.";
    
    console.error("Throwing error:", errorMessage);
    throw new Error(errorMessage);
  }
};
