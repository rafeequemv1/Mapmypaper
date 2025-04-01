
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (for security reasons)
const API_KEY = "AIzaSyDSIsUi6GsIpxVTaQdL60NV5QvBLs5sb44";

// Initialize the Generative AI API with your API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate structured summary from PDF text
export const generateStructuredSummary = async () => {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    
    if (!pdfText) {
      throw new Error("No PDF text found");
    }
    
    // Limit the text to avoid exceeding token limits (first 25,000 chars)
    const limitedText = pdfText.slice(0, 25000);
    
    // Create a prompt for structured summary
    const prompt = `
      Please analyze the following academic paper and create a structured summary with these sections:
      
      1. Summary: A concise overview of the paper (2-3 paragraphs)
      2. Key Findings: The most important discoveries or conclusions
      3. Objectives: What the paper aimed to accomplish
      4. Methods: How the research was conducted
      5. Results: What data was found
      6. Conclusions: What the results mean
      7. Key Concepts: Important ideas or terms introduced
      
      For each point where you reference specific information from the paper, include [citation:pageX] where X is an estimated page number.
      
      Paper text:
      ${limitedText}
    `;
    
    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the structured text into sections
    return parseStructuredResponse(text);
  } catch (error) {
    console.error("Error generating summary:", error);
    
    // Return a fallback structure with error messages
    return {
      "Summary": "Could not generate summary. Please try again.",
      "Key Findings": "Error processing the PDF content.",
      "Objectives": "Error analyzing the paper objectives.",
      "Methods": "Error extracting methodology information.",
      "Results": "Error summarizing results.",
      "Conclusions": "Error processing conclusions.",
      "Key Concepts": "Error identifying key concepts."
    };
  }
};

// Helper function to parse the structured response
const parseStructuredResponse = (text: string) => {
  const sections = [
    "Summary",
    "Key Findings",
    "Objectives",
    "Methods",
    "Results",
    "Conclusions",
    "Key Concepts"
  ];
  
  const result: Record<string, string> = {};
  
  // Default values in case parsing fails
  sections.forEach(section => {
    result[section] = `Failed to extract ${section.toLowerCase()}.`;
  });
  
  try {
    // Find each section in the response
    let currentSection = "";
    let currentContent = "";
    
    // Split the text into lines
    const lines = text.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a section header
      const sectionMatch = sections.find(section => 
        line.toLowerCase().includes(section.toLowerCase()) && 
        (line.includes(":") || line.includes(".") || line.endsWith(section))
      );
      
      if (sectionMatch || i === lines.length - 1) {
        // Save the previous section content if we have one
        if (currentSection && currentContent) {
          result[currentSection] = currentContent.trim();
        }
        
        // Start a new section
        if (sectionMatch) {
          currentSection = sectionMatch;
          currentContent = "";
          continue;
        }
      }
      
      // Add line to current section content if we're in a section
      if (currentSection) {
        currentContent += line + "\n";
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing structured response:", error);
    return result;
  }
};

export default generateStructuredSummary;
