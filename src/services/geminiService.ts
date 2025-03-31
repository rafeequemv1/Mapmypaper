import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";

// Initialize the Generative AI API
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyDiXKI_QJHXYgGderjMFsJoE7Jli_ZPVkQ"
);

// Function to extract text from a PDF
// Note: pdf-lib doesn't actually support text extraction directly
// This is a placeholder that will return page numbers but not actual text content
const extractTextFromPdf = async (file: File): Promise<string> => {
  const fileData = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileData);
  
  const numPages = pdfDoc.getPageCount();
  let text = "";
  
  // Add page information since pdf-lib doesn't have direct text extraction
  for (let i = 0; i < numPages; i++) {
    // Instead of calling getText() which doesn't exist, we just indicate the page number
    text += `Page ${i + 1}\n\n`;
  }
  
  return text;
};

// Get the current PDF file from localStorage
const getCurrentPdfFile = (): File | null => {
  const pdfData = localStorage.getItem("currentPdf");
  if (!pdfData) return null;
  
  try {
    const parsedData = JSON.parse(pdfData);
    const { fileName, fileType, fileData } = parsedData;
    
    // Convert base64 to Blob
    const byteCharacters = atob(fileData);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: fileType });
    return new File([blob], fileName, { type: fileType });
    
  } catch (error) {
    console.error("Error parsing PDF data:", error);
    return null;
  }
};

// Generate a flowchart from the PDF
export const generateFlowchartFromPdf = async (type: 'flowchart' | 'sequence' | 'mindmap' = 'flowchart'): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  // Extract text from PDF
  const text = await extractTextFromPdf(pdfFile);
  
  // Generate flowchart using Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const systemPrompt = type === 'flowchart' ? 
    `You are a helpful assistant that creates Mermaid flowcharts based on PDF content.
     Create a detailed and well-organized flowchart that represents the main concepts and processes described in the document.
     Use appropriate node shapes and styles.
     Use ONLY Mermaid flowchart syntax.
     Be sure to use the "flowchart TD" directive at the beginning.
     Return just the Mermaid code for the flowchart, with no additional explanation.`
    : 
    type === 'sequence' ? 
    `You are a helpful assistant that creates Mermaid sequence diagrams based on PDF content.
     Create a detailed and well-organized sequence diagram that represents the interactions, flows, and communications described in the document.
     Use appropriate actors and messages.
     Use ONLY Mermaid sequence diagram syntax.
     Be sure to use the "sequenceDiagram" directive at the beginning.
     Return just the Mermaid code for the sequence diagram, with no additional explanation.`
    :
    `You are a helpful assistant that creates Mermaid mind maps based on PDF content.
     Create a detailed and well-organized mind map that represents the main concepts and their relationships described in the document.
     Use appropriate node structure with relevant topics and subtopics.
     Use ONLY Mermaid mindmap syntax.
     Be sure to use the "mindmap" directive at the beginning.
     Return just the Mermaid code for the mind map, with no additional explanation.`;

  try {
    const result = await model.generateContent([
      systemPrompt,
      `Create a ${type} based on the following PDF content:\n\n${text}`
    ]);
    
    const response = await result.response;
    const flowchartCode = response.text();
    
    return flowchartCode;
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
};

// New function for mind map generation from text (for PdfUpload.tsx)
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    // Generate mind map structure using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const systemPrompt = `You are a helpful assistant that creates structured mind maps based on document content.
      Analyze the provided text and create a hierarchical mind map structure.
      The output should be a JSON object with 'root' as the main node and 'children' for subtopics.
      Each node should have at minimum 'id', 'topic' (content), and optionally 'children'.
      Focus on extracting the main concepts, their relationships, and hierarchical structure.
      Be concise but comprehensive in your analysis.`;
    
    const result = await model.generateContent([
      systemPrompt,
      `Create a structured mind map from the following text:\n\n${text}`
    ]);
    
    const response = await result.response;
    const mindMapText = response.text();
    
    // Parse the JSON response, with fallback to a simple structure
    try {
      return JSON.parse(mindMapText);
    } catch (parseError) {
      console.error("Error parsing mind map JSON:", parseError);
      // Return a simple default structure
      return {
        root: {
          id: "root",
          topic: "Document Summary",
          children: [
            {
              id: "child1",
              topic: "Main Concept",
              children: []
            }
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    throw error;
  }
};

// Function to chat with Gemini about the PDF content
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  try {
    // Extract text from PDF if not already cached
    const text = await extractTextFromPdf(pdfFile);
    
    // Chat with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const systemPrompt = `You are a helpful academic assistant that helps users understand PDF documents.
      You have access to the content of a PDF that the user has uploaded.
      Answer the user's questions based on the PDF content.
      If the answer is not in the PDF, politely say so and provide general information if possible.
      Keep your answers concise, informative, and directly relevant to the query.`;
    
    const result = await model.generateContent([
      systemPrompt,
      `PDF Content:\n${text}\n\nUser Question: ${message}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error chatting with Gemini about PDF:", error);
    throw error;
  }
};

// Function to generate a structured summary of the PDF content
export const generateStructuredSummary = async (format: 'bullets' | 'paragraphs' | 'sections' = 'sections'): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  try {
    // Extract text from PDF
    const text = await extractTextFromPdf(pdfFile);
    
    // Generate summary using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const promptFormat = format === 'bullets' ? 'bullet points' : 
                        format === 'paragraphs' ? 'concise paragraphs' : 
                        'sections with headings';
    
    const systemPrompt = `You are a helpful academic assistant that summarizes documents.
      Create a structured summary of the provided document in ${promptFormat} format.
      Focus on the main ideas, key findings, and important conclusions.
      Be concise but comprehensive in your summary.
      Organize the information logically to make it easy to understand.`;
    
    const result = await model.generateContent([
      systemPrompt,
      `Summarize the following document content in ${promptFormat} format:\n\n${text}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw error;
  }
};
