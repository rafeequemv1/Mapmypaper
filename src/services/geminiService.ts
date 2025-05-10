import { callGeminiAPI } from "@/utils/geminiApiUtils";
import PdfToText from "react-pdftotext";
import { storePdfData, getPdfData, isMindMapReady, setCurrentPdf, clearPdfData } from "@/utils/pdfStorage";

// Helper to get current PDF data
async function getCurrentPdfData(): Promise<string | null> {
  try {
    // First, check sessionStorage for the current PDF key
    const currentPdfKey = sessionStorage.getItem('currentPdfKey');
    
    if (!currentPdfKey) {
      return null;
    }
    
    // Get the PDF data using the key
    return await getPdfData(currentPdfKey);
  } catch (error) {
    console.error("Error getting current PDF data:", error);
    throw new Error("Could not get current PDF data: " + (error as Error).message);
  }
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
    // Convert Uint8Array to Blob to make it compatible
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    const extractedText = await PdfToText(blob);
    
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

// Add the missing functions for FlowchartModal.tsx
export async function generateFlowchartFromPdf(): Promise<string> {
  try {
    const currentPdfData = await getCurrentPdfData();
    if (!currentPdfData) {
      throw new Error("No PDF found");
    }

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(currentPdfData);
    
    // Create prompt for flowchart generation
    const flowchartPrompt = `
    Create a flowchart diagram in Mermaid syntax that represents the structure and main points of this document.
    Use the flowchart LR (left to right) format.
    Focus on the key sections, methodologies, and conclusions.
    Keep it clear and simple with not more than 10 nodes.
    Only output the raw Mermaid syntax with no explanations.
    
    Here's the document text: ${pdfText.slice(0, 8000)}
    `;
    
    // Generate the flowchart
    const flowchartCode = await callGeminiAPI(flowchartPrompt);
    
    // Clean the response to ensure it only contains valid Mermaid syntax
    const cleanedCode = cleanMermaidSyntax(flowchartCode, 'flowchart');
    
    return cleanedCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error("Could not generate flowchart: " + (error as Error).message);
  }
}

export async function generateMindmapFromPdf(): Promise<string> {
  try {
    const currentPdfData = await getCurrentPdfData();
    if (!currentPdfData) {
      throw new Error("No PDF found");
    }

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(currentPdfData);
    
    // Create prompt for mindmap generation
    const mindmapPrompt = `
    Create a mind map in Mermaid syntax that represents the main concepts and their relationships in this document.
    Use the mindmap format.
    Focus on hierarchical organization of ideas with a clear central topic.
    Keep it clear with not more than 3 levels of depth.
    Only output the raw Mermaid syntax with no explanations.
    
    Here's the document text: ${pdfText.slice(0, 8000)}
    `;
    
    // Generate the mindmap
    const mindmapCode = await callGeminiAPI(mindmapPrompt);
    
    // Clean the response to ensure it only contains valid Mermaid syntax
    const cleanedCode = cleanMermaidSyntax(mindmapCode, 'mindmap');
    
    return cleanedCode;
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw new Error("Could not generate mindmap: " + (error as Error).message);
  }
}

// Helper function to clean Mermaid syntax
function cleanMermaidSyntax(code: string, type: 'flowchart' | 'mindmap'): string {
  // Remove any markdown code block markers
  let cleanedCode = code.replace(/```(?:mermaid|)\n?|\n?```/g, '').trim();
  
  // Ensure the code starts with the correct diagram type
  if (type === 'flowchart' && !cleanedCode.startsWith('flowchart')) {
    cleanedCode = 'flowchart LR\n' + cleanedCode;
  } else if (type === 'mindmap' && !cleanedCode.startsWith('mindmap')) {
    cleanedCode = 'mindmap\n' + cleanedCode;
  }
  
  return cleanedCode;
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
    // Explicitly request JSON format in the options
    const response = await callGeminiAPI(prompt, { responseFormat: "json" });
    
    // Parse the JSON response or handle errors
    try {
      return JSON.parse(response);
    } catch (jsonError) {
      console.error("Error parsing mind map JSON:", jsonError);
      
      // If parsing fails, return a fallback mind map structure
      return {
        "topic": "Document Analysis",
        "children": [
          {
            "topic": "Main Topics",
            "children": [
              { "topic": "Topic 1" },
              { "topic": "Topic 2" },
              { "topic": "Topic 3" }
            ]
          },
          {
            "topic": "Key Findings",
            "children": [
              { "topic": "Finding 1" },
              { "topic": "Finding 2" }
            ]
          }
        ]
      };
    }
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
      // Get all PDF keys from sessionStorage
      const pdfKeys = Object.keys(sessionStorage)
        .filter(key => key.startsWith("pdfMeta_"))
        .map(key => key.replace("pdfMeta_", ""));
      
      if (pdfKeys.length === 0) {
        throw new Error("No PDFs found");
      }
      
      for (const pdfKey of pdfKeys) {
        // Get PDF data for each key
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
  // Enhanced prompt for image analysis
  const prompt = `
  Analyze the following image and provide a detailed description of its content.
  Focus on identifying key elements, objects, and any relevant context.
  If the image contains text, please extract and include it in your analysis.
  
  If the image appears to be blank or all white, please mention this specifically and suggest possible reasons 
  (e.g., image failed to load, image is actually blank, or there might be very light content that's hard to see).
  `;

  try {
    console.log("Sending image to Gemini API for analysis...");
    
    // Check if image data is valid
    if (!imageData || imageData.trim() === "") {
      console.error("Invalid image data provided");
      return "Error: No valid image data provided for analysis.";
    }
    
    // Log image data length for debugging
    console.log(`Image data length: ${imageData.length} characters`);
    
    // Add a timeout to prevent hanging on API calls
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Image analysis timed out after 15 seconds")), 15000);
    });
    
    // Call Gemini API with timeout
    const responsePromise = callGeminiAPI(prompt, { image: imageData });
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    console.log("Received response from Gemini API for image analysis");
    
    if (!response || response.trim() === "") {
      return "The image analysis did not return any results. This might be because the image is blank, the image data is invalid, or there was an issue with the analysis service.";
    }
    
    return response;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return `Error analyzing image: ${(error as Error).message}. Please try again with a different image or check if the image is valid.`;
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
