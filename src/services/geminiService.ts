
import { callGeminiAPI } from "@/utils/geminiApiUtils";
import PdfToText from "react-pdftotext";
import { storePdfData, getPdfData, isMindMapReady, getCurrentPdf, setCurrentPdf, getAllPdfs, deletePdfData } from "@/utils/pdfStorage";

// Helper function to get current PDF data
async function getCurrentPdfData(): Promise<string | null> {
  const currentPdfKey = await getCurrentPdf();
  if (!currentPdfKey) return null;
  
  return getPdfData(currentPdfKey);
}

// Modified function to generate structured summary based on document type detection
export async function generateStructuredSummary(): Promise<any> {
  try {
    const currentPdfData = await getCurrentPdfData();
    if (!currentPdfData) {
      throw new Error("No PDF found");
    }

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(currentPdfData);
    
    // First, detect the document type
    const documentTypePrompt = `
    Analyze the following document text and determine if it's a:
    1. Research paper
    2. Book
    3. Article
    4. Generic document
    
    Only respond with ONE of these exact terms: "research_paper", "book", "article", or "generic".
    Document text: ${pdfText.slice(0, 5000)}
    `;
    
    // Get the document type
    const documentType = await callGeminiAPI(documentTypePrompt, { maxTokens: 50 });
    console.log("Detected document type:", documentType.trim());
    
    // Based on document type, create the appropriate prompt
    let summaryPrompt;
    
    switch(documentType.trim()) {
      case "book":
        summaryPrompt = `
        Create a structured summary of this book. Format your response as a JSON object with these keys:
        - Summary: A comprehensive overview of the book in 2-3 paragraphs
        - Plot Summary: Outline of the main plot points and narrative arc
        - Main Characters: Description of the key characters and their roles
        - Setting: Where and when the story takes place
        - Key Themes: Major themes explored in the book
        - Chapter Breakdown: Brief summary of key chapters or sections
        - Key Concepts: Important concepts or ideas presented

        Book text: ${pdfText}
        `;
        break;
        
      case "article":
        summaryPrompt = `
        Create a structured summary of this article. Format your response as a JSON object with these keys:
        - Summary: A comprehensive overview in 2-3 paragraphs
        - Key Findings: The main takeaways and discoveries
        - Main Points: The core arguments presented
        - Important Details: Notable facts, statistics or quotations
        - Key Concepts: Important concepts or ideas presented

        Article text: ${pdfText}
        `;
        break;
        
      case "research_paper":
        summaryPrompt = `
        Create a structured summary of this academic paper. Format your response as a JSON object with these keys:
        - Summary: A comprehensive overview in 2-3 paragraphs
        - Key Findings: The main results and their significance
        - Objectives: The research questions or hypothesis
        - Methods: How the research was conducted
        - Results: What was found
        - Conclusions: What the findings mean
        - Key Concepts: Important concepts or ideas presented

        Paper text: ${pdfText}
        `;
        break;
        
      default: // generic document
        summaryPrompt = `
        Create a structured summary of this document. Format your response as a JSON object with these keys:
        - Summary: A comprehensive overview in 2-3 paragraphs
        - Key Findings: The main takeaways or important points
        - Main Points: The core information presented
        - Important Details: Notable facts, figures or quotations
        - Key Concepts: Important concepts or ideas presented

        Document text: ${pdfText}
        `;
    }
    
    // Get the structured summary with the appropriate prompt
    const rawSummary = await callGeminiAPI(summaryPrompt);
    
    // Parse the summary from JSON string format
    try {
      return parseJSONResponse(rawSummary);
    } catch (error) {
      console.error("Error parsing summary JSON:", error);
      throw new Error("Could not parse summary results");
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error("Could not generate structured summary: " + (error as Error).message);
  }
}

// Helper to extract text from PDF data URL
async function extractTextFromPDF(pdfDataUrl: string): Promise<string> {
  try {
    // Fetch the PDF data
    const response = await fetch(pdfDataUrl);
    const buffer = await response.arrayBuffer();
    
    // Convert buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    // Use react-pdftotext to extract text
    const extractedText = await PdfToText(uint8Array);
    
    if (!extractedText || typeof extractedText !== "string" || extractedText.trim() === "") {
      throw new Error("The PDF appears to have no extractable text. It might be a scanned document or an image-based PDF.");
    }
    
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Could not extract text from PDF: " + (error as Error).message);
  }
}

// Helper to parse JSON response from Gemini, handling potential formatting issues
function parseJSONResponse(response: string): any {
  try {
    // Try to parse as is
    return JSON.parse(response);
  } catch (error) {
    // Clean up and try again
    try {
      // Look for JSON object within response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    } catch (innerError) {
      console.error("Error parsing cleaned JSON:", innerError);
      // Return a structured object with the raw response as summary
      return {
        Summary: response,
        "Key Findings": "Could not extract structured data"
      };
    }
  }
}

export async function generateMindMapFromText(text: string): Promise<any> {
  const prompt = `
  Given the following text, create a mind map in JSON format.
  The mind map should have a central topic and related subtopics.
  Each subtopic can have its own subtopics, creating a hierarchical structure.
  The JSON format should be as follows:
  {
    "topic": "Central Topic",
    "children": [
      {
        "topic": "Subtopic 1",
        "children": [
          {
            "topic": "Sub-subtopic 1"
          },
          {
            "topic": "Sub-subtopic 2"
          }
        ]
      },
      {
        "topic": "Subtopic 2"
      }
    ]
  }
  Text: ${text}
  `;

  try {
    const response = await callGeminiAPI(prompt);
    // Parse the JSON response
    const mindMapData = JSON.parse(response);
    return mindMapData;
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw error;
  }
}

export async function chatWithGeminiAboutPdf(prompt: string, useAllPdfs: boolean = false): Promise<string> {
  try {
    let pdfText = "";
    
    if (useAllPdfs) {
      // Fetch all PDFs and combine their text content
      const allPdfs = await getAllPdfs();
      if (!allPdfs || allPdfs.length === 0) {
        throw new Error("No PDFs found");
      }
      
      for (const pdfKey in allPdfs) {
        const pdfData = await getPdfData(pdfKey);
        if (pdfData) {
          const extractedText = await extractTextFromPDF(pdfData);
          pdfText += extractedText + "\n"; // Add a newline separator between PDFs
        }
      }
    } else {
      // Use only the current PDF
      const currentPdfData = await getCurrentPdfData();
      if (!currentPdfData) {
        throw new Error("No PDF found");
      }
      pdfText = await extractTextFromPDF(currentPdfData);
    }

    const geminiPrompt = `
    You are a research assistant helping a user understand a document.
    Here is the document text: ${pdfText}
    Now, answer the following question: ${prompt}
    `;

    const response = await callGeminiAPI(geminiPrompt);
    return response;
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    throw error;
  }
}

export async function analyzeImageWithGemini(imageData: string): Promise<string> {
  const prompt = `
  Analyze the following image and provide a detailed description of its content.
  Focus on identifying key elements, objects, and any relevant context.
  If the image contains text, please extract and include it in your analysis.
  `;

  try {
    const response = await callGeminiAPI(prompt, { image: imageData });
    return response;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

export async function analyzeFileWithGemini(fileContent: string, fileName: string, fileType: string): Promise<string> {
  const prompt = `
  Analyze the following file content and provide a detailed description of its content.
  File Name: ${fileName}
  File Type: ${fileType}
  Content: ${fileContent}
  Focus on identifying key elements, objects, and any relevant context.
  If the content contains structured data, please extract and include it in your analysis.
  `;

  try {
    const response = await callGeminiAPI(prompt);
    return response;
  } catch (error) {
    console.error("Error analyzing file:", error);
    throw error;
  }
}
