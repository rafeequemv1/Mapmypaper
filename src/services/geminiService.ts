
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { getPdfData, getCurrentPdfData, getPdfText } from "@/utils/pdfStorage";
import { getAllPdfs, getPdfKey } from "@/components/PdfTabs";

// Initialize the Google Generative AI with your API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Set up safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Get the model
const getModel = () => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    safetySettings,
  });
  return model;
};

// Extract and process PDF text
let pdfText = "";
let currentPdfKey = "";

// Function to get the current PDF text
export const getCurrentPdfText = async (): Promise<string> => {
  try {
    const pdfData = await getCurrentPdfData();
    if (!pdfData) {
      console.error("No current PDF data found");
      return "";
    }
    if (!pdfText || pdfText.trim() === "") {
      pdfText = await getPdfText();
    }
    return pdfText;
  } catch (error) {
    console.error("Error getting current PDF text:", error);
    return "";
  }
};

// Generate a mind map from text
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    const model = getModel();
    if (!apiKey) {
      console.error("API key is missing");
      return { root: { topic: "Error: API Key Missing" } };
    }

    const prompt = `You are tasked with creating a structured mind map for the following academic paper or document. Generate a JSON structure that can be used for a mind map visualization.
    
    Format your response as a valid JSON object with this exact structure:
    {
      "root": {
        "topic": "Main Title Here",
        "children": [
          {
            "topic": "Major Section 1",
            "children": [
              {"topic": "Subsection 1.1"},
              {"topic": "Subsection 1.2"}
            ]
          },
          {
            "topic": "Major Section 2",
            "children": [
              {"topic": "Subsection 2.1"},
              {"topic": "Subsection 2.2"}
            ]
          }
        ]
      }
    }
    
    Important guidelines:
    - The root topic should be the title of the paper or a concise summary
    - Include 3-7 major sections as direct children of the root
    - Each major section should have 2-5 subsections
    - Subsections can have their own children if needed, but keep the hierarchy manageable
    - Keep node text concise (under 50 characters if possible)
    - Ensure the structure accurately represents the document's content and organization
    - Make sure the JSON is properly formatted and valid
    
    Here is the document to analyze:
    
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/{[\s\S]*}/);
      let jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textResponse;
      
      // Clean up the JSON string
      jsonString = jsonString.replace(/```json|```/g, "").trim();
      
      // Parse the JSON
      const mindMapData = JSON.parse(jsonString);
      return mindMapData;
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return { root: { topic: "Error: Could not parse mindmap" } };
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    return { root: { topic: "Error: Generation Failed" } };
  }
};

// Chat with Gemini about the current PDF
export const chatWithGeminiAboutPdf = async (
  prompt: string
): Promise<string> => {
  try {
    const model = getModel();
    if (!apiKey) {
      return "Error: API key is missing. Please provide a valid Gemini API key.";
    }

    // Get the current PDF text
    const pdfTextContent = await getCurrentPdfText();
    if (!pdfTextContent || pdfTextContent.trim() === "") {
      return "I don't see any PDF content to analyze. Please upload a PDF document first.";
    }

    // Create a context-aware prompt
    const contextPrompt = `You are a helpful research assistant analyzing a PDF document. 
    When referring to specific sections of the document, use [citation:pageX] notation where X is the page number.
    
    The following is the content of the PDF document:
    
    ${pdfTextContent.substring(0, 100000)} 
    
    Using the PDF content above, please respond to the following prompt:
    
    ${prompt}`;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const textResponse = response.text();
    
    return textResponse;
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    return `I encountered an error while analyzing the PDF. Please try again.`;
  }
};

// Analyze an image with Gemini
export const analyzeImageWithGemini = async (
  imageBase64: string
): Promise<string> => {
  try {
    // Use the vision model for image analysis
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    
    if (!apiKey) {
      return "Error: API key is missing. Please provide a valid Gemini API key.";
    }

    // Get PDF text for context
    const pdfTextContent = await getCurrentPdfText();
    const pdfContext = pdfTextContent 
      ? `The image is from a document with the following context: ${pdfTextContent.substring(0, 3000)}` 
      : "";

    // Create a prompt for image analysis
    const prompt = `Analyze this image from a PDF document. 
    Describe what you see in detail. 
    If there are charts, graphs, or diagrams, explain what they represent.
    If there is text in the image, include that in your analysis.
    ${pdfContext}`;

    // Process the image
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), mimeType: "image/png" } }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return "I encountered an error analyzing this image. Please try again.";
  }
};

// Analyze a file with Gemini
export const analyzeFileWithGemini = async (
  fileContent: string,
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    const model = getModel();
    if (!apiKey) {
      return "Error: API key is missing. Please provide a valid Gemini API key.";
    }

    // Create a prompt for file analysis
    const prompt = `Analyze this file named "${fileName}" of type "${fileType}".
    
    File content:
    ${fileContent.substring(0, 25000)}
    
    Provide a detailed analysis of this file. Include key information, patterns, and insights.
    If it's structured data like CSV or JSON, summarize the structure and main data points.
    If it contains text content, summarize the main topics and important information.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing file with Gemini:", error);
    return "I encountered an error analyzing this file. Please try again.";
  }
};

// New function to compare PDFs
export const comparePdfsWithGemini = async (
  uploadedPdfText: string,
  uploadedPdfName: string,
  activePdfKey: string
): Promise<string> => {
  try {
    const model = getModel();
    if (!apiKey) {
      return "Error: API key is missing. Please provide a valid Gemini API key.";
    }

    // Get the main PDF text
    const pdfTextContent = await getCurrentPdfText();
    if (!pdfTextContent || pdfTextContent.trim() === "") {
      return `I've analyzed "${uploadedPdfName}" but I don't have access to the main document for comparison.`;
    }

    // Get the active PDF metadata
    const allPdfs = getAllPdfs();
    const activePdfMeta = allPdfs.find(meta => getPdfKey(meta) === activePdfKey);
    const activePdfName = activePdfMeta ? activePdfMeta.name : "main document";

    // Create a prompt for comparison
    const prompt = `You are comparing two academic papers or documents.
    
    Document 1 (Main document): "${activePdfName}"
    First 15,000 characters of Document 1:
    ${pdfTextContent.substring(0, 15000)}
    
    Document 2 (Uploaded for comparison): "${uploadedPdfName}"
    First 15,000 characters of Document 2:
    ${uploadedPdfText.substring(0, 15000)}
    
    Provide a detailed comparison between these two documents. Include:
    1. Key similarities in topics, methodology, or findings
    2. Major differences or contradictions
    3. How Document 2 might complement or challenge Document 1
    4. Any unique insights found only in one document but not the other
    5. A brief assessment of whether these documents support or contradict each other
    
    Use clear section headers and bullet points where appropriate. Be specific and cite examples from both documents.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error comparing PDFs with Gemini:", error);
    return "I encountered an error comparing these documents. Please try again.";
  }
};

// Function for generating a structured summary of the document
export const generateStructuredSummary = async (): Promise<string> => {
  try {
    const model = getModel();
    if (!apiKey) {
      return "Error: API key is missing. Please provide a valid Gemini API key.";
    }

    // Get the current PDF text
    const pdfTextContent = await getCurrentPdfText();
    if (!pdfTextContent || pdfTextContent.trim() === "") {
      return "I don't see any PDF content to analyze. Please upload a PDF document first.";
    }

    // Create a prompt for structured summary
    const prompt = `You are analyzing an academic paper or document. Create a comprehensive, structured summary with the following sections:
    
    1. OVERVIEW: Provide a concise summary of the document in 2-3 sentences.
    
    2. KEY FINDINGS: Bullet point the main findings or conclusions (3-5 points).
    
    3. METHODOLOGY: Briefly describe the research methods or approach used.
    
    4. IMPLICATIONS: Explain the significance of this document and its potential impact.
    
    5. LIMITATIONS: Identify any limitations or gaps mentioned in the document.
    
    6. FUTURE DIRECTIONS: Note any suggestions for future research or next steps.
    
    Here is the document to analyze:
    
    ${pdfTextContent.substring(0, 100000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    return "I encountered an error generating the summary. Please try again.";
  }
};
