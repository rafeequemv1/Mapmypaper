// Import necessary libraries and utilities
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPdfData } from "@/utils/pdfStorage";
import { getAllPdfs } from "@/components/PdfTabs";

// Initialize the Google Generative AI client with API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate a mind map from text
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    // Use the Gemini Pro model for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a prompt for mind map generation
    const prompt = `
      Create a hierarchical mind map structure from the following text. 
      Format the output as a JSON object with the following structure:
      {
        "root": {
          "topic": "Main Topic",
          "children": [
            {
              "topic": "Subtopic 1",
              "children": [
                { "topic": "Detail 1" },
                { "topic": "Detail 2" }
              ]
            },
            {
              "topic": "Subtopic 2",
              "children": []
            }
          ]
        }
      }
      
      Extract the main topic, key subtopics, and important details.
      Limit to 3-5 main subtopics and 2-4 details per subtopic.
      Use concise language for topics (5 words max).
      
      Here's the text to analyze:
      ${text.substring(0, 15000)}
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/```\n([\s\S]*?)\n```/) ||
                      textResponse.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      const jsonString = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
      return JSON.parse(jsonString);
    } else {
      try {
        // Try parsing the entire response as JSON
        return JSON.parse(textResponse);
      } catch (e) {
        console.error("Failed to parse JSON from response:", textResponse);
        throw new Error("Invalid mind map structure returned");
      }
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map");
  }
};

// Modified function to accept optional pdfKey parameter
export const chatWithGeminiAboutPdf = async (prompt: string, pdfKey: string | null = null): Promise<string> => {
  console.log(`Chatting with Gemini about PDF: ${pdfKey || 'all PDFs'}`);

  try {
    // Get the PDF content based on the pdfKey parameter
    let pdfContent = "";
    
    if (pdfKey) {
      // Get specific PDF content
      const specificPdfContent = await getPdfData(pdfKey);
      if (specificPdfContent) {
        pdfContent = specificPdfContent;
      } else {
        throw new Error(`PDF content not found for key: ${pdfKey}`);
      }
    } else {
      // Get all PDFs content
      const allPdfs = getAllPdfs();
      const pdfContents = await Promise.all(
        allPdfs.map(async (pdfKey) => {
          const content = await getPdfData(pdfKey);
          return content ? `[Document: ${pdfKey}]\n${content}\n\n` : "";
        })
      );
      pdfContent = pdfContents.join("");
    }
    
    // Truncate PDF content if it's too large
    const maxLength = 30000; // Adjust based on model limitations
    if (pdfContent.length > maxLength) {
      pdfContent = pdfContent.substring(0, maxLength) + 
        "\n\n[Content truncated due to length limitations]";
    }
    
    // Use the Gemini Pro model for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a prompt that includes the PDF content and user query
    const fullPrompt = `
      You are a helpful research assistant analyzing PDF documents.
      
      Here is the content from ${pdfKey ? 'the specific PDF' : 'all PDFs'} to analyze:
      
      ${pdfContent}
      
      User query: ${prompt}
      
      Provide a detailed, helpful response. When referencing specific information from the document,
      include page citations in the format [citation:pageX] where X is the page number.
    `;
    
    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini PDF chat:", error);
    throw new Error("Failed to get response from AI");
  }
};

// Function to analyze an image with Gemini Vision
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Use the Gemini Pro Vision model for image analysis
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Create a prompt for image analysis
    const prompt = `
      Analyze this image in detail. Describe what you see, including:
      - Any visible text content
      - Charts, graphs, or diagrams and their meaning
      - Key visual elements and their significance
      - Any data or information presented
      
      Be thorough but concise. If the image contains text from a research paper or document,
      explain the context and significance of the information shown.
    `;
    
    // Generate content with the image
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to analyze image");
  }
};

// Function to analyze a file with Gemini
export const analyzeFileWithGemini = async (
  fileContent: string,
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    // Use the Gemini Pro model for text analysis
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Truncate file content if it's too large
    const maxLength = 30000; // Adjust based on model limitations
    const truncatedContent = fileContent.length > maxLength
      ? fileContent.substring(0, maxLength) + "\n\n[Content truncated due to length limitations]"
      : fileContent;
    
    // Create a prompt based on file type
    let prompt = `
      Analyze the following ${fileType} file named "${fileName}".
      
      File content:
      ${truncatedContent}
      
      Provide a detailed analysis including:
      - Summary of the content
      - Key information and insights
      - Structure and organization
      - Any notable patterns or findings
      
      Be thorough but concise in your analysis.
    `;
    
    // Add specific instructions based on file type
    if (fileType === "text/csv" || fileType.includes("spreadsheet")) {
      prompt += `
        For this spreadsheet/CSV data:
        - Identify the columns/data structure
        - Summarize key statistics (if applicable)
        - Note any trends or patterns in the data
        - Suggest possible insights or conclusions
      `;
    } else if (fileType === "application/json") {
      prompt += `
        For this JSON data:
        - Explain the data structure
        - Identify key objects and their properties
        - Summarize the relationships between data elements
        - Note any interesting values or patterns
      `;
    }
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing file with Gemini:", error);
    throw new Error("Failed to analyze file");
  }
};

// Add the missing function for structured summary generation
export const generateStructuredSummary = async (): Promise<object> => {
  try {
    // Get the current PDF content
    const currentPdfKey = sessionStorage.getItem('currentPdfKey');
    if (!currentPdfKey) {
      throw new Error("No PDF is currently selected");
    }
    
    const pdfContent = await getPdfData(currentPdfKey);
    if (!pdfContent) {
      throw new Error("Failed to retrieve PDF content");
    }
    
    // Truncate PDF content if it's too large
    const maxLength = 30000;
    const truncatedContent = pdfContent.length > maxLength
      ? pdfContent.substring(0, maxLength) + "\n\n[Content truncated due to length limitations]"
      : pdfContent;
    
    // Use the Gemini Pro model for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Create a structured summary of the following research paper. 
      Analyze the content and output a JSON object with the following structure:
      
      {
        "Summary": "Brief overview of the paper",
        "Key Findings": "Main discoveries or conclusions",
        "Objectives": "Goals and aims of the research",
        "Methods": "Methodology and approach",
        "Results": "Key outcomes and data",
        "Conclusions": "Final interpretations and implications",
        "Key Concepts": "Important terms and ideas"
      }
      
      For each section, provide 3-5 sentences of concise, informative content.
      Include page references when appropriate in the format [citation:pageX].
      
      Here is the paper content to analyze:
      
      ${truncatedContent}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      textResponse.match(/```\n([\s\S]*?)\n```/) ||
                      textResponse.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      const jsonString = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
      return JSON.parse(jsonString);
    } else {
      try {
        // Try parsing the entire response as JSON
        return JSON.parse(textResponse);
      } catch (e) {
        console.error("Failed to parse JSON from response:", textResponse);
        // Return a simplified object with error information
        return {
          "Summary": "Error parsing AI response",
          "Key Findings": "Could not extract structured data from the AI response.",
          "Objectives": "Please try again or check the paper manually.",
          "Methods": "",
          "Results": "",
          "Conclusions": "",
          "Key Concepts": ""
        };
      }
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error("Failed to generate summary");
  }
};
