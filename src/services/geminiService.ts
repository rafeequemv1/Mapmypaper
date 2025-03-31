
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";

// Initialize the Generative AI API
const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyDiXKI_QJHXYgGderjMFsJoE7Jli_ZPVkQ"
);

// Function to extract text from a PDF
const extractTextFromPdf = async (file: File): Promise<string> => {
  const fileData = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileData);
  
  const numPages = pdfDoc.getPageCount();
  let text = "";
  
  // Extract text from each page
  for (let i = 0; i < numPages; i++) {
    const page = pdfDoc.getPage(i);
    text += `Page ${i + 1}:\n${page.getText()}\n\n`;
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
