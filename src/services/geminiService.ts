
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI API with default key
const getGenAI = () => {
  const apiKey = localStorage.getItem("GOOGLE_API_KEY") || "AIzaSyDWXTmFBjvvpiws05s571DVsxlhmvezTbQ";
  return new GoogleGenerativeAI(apiKey);
};

// Check if a valid API key exists in storage
export const checkGeminiAPIKey = async (): Promise<boolean> => {
  const apiKey = localStorage.getItem("GOOGLE_API_KEY");
  
  if (!apiKey) {
    return false;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple test request
    const result = await model.generateContent("Hello");
    const response = await result.response;
    const text = response.text();
    
    return text.length > 0;
  } catch (error) {
    console.error("API key validation failed:", error);
    return false;
  }
};

// Save API key to localStorage
export const saveGeminiAPIKey = (apiKey: string): void => {
  localStorage.setItem("GOOGLE_API_KEY", apiKey);
};

// Function to extract text from a PDF - simplified placeholder since we can't use pdf-lib
const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
  if (pdfData) {
    try {
      const parsedData = JSON.parse(pdfData);
      return parsedData.text || `Sample PDF text for ${file.name}`;
    } catch (error) {
      console.error("Error parsing PDF data:", error);
    }
  }
  return `Sample PDF text for ${file.name}`;
};

// Get the current PDF file from sessionStorage
const getCurrentPdfFile = (): File | null => {
  const pdfData = sessionStorage.getItem('pdfData') || sessionStorage.getItem('uploadedPdfData');
  if (!pdfData) return null;
  
  try {
    const parsedData = JSON.parse(pdfData);
    if (parsedData.binaryData) {
      // Convert base64 to Blob
      const byteCharacters = atob(parsedData.binaryData.split(',')[1]);
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
      
      const blob = new Blob(byteArrays, { type: 'application/pdf' });
      return new File([blob], parsedData.name || 'document.pdf', { type: 'application/pdf' });
    }
    return null;
  } catch (error) {
    console.error("Error parsing PDF data:", error);
    return null;
  }
};

// Generate a flowchart from the PDF
export const generateFlowchartFromPdf = async (type = 'flowchart'): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  // Extract text from PDF
  const text = await extractTextFromPdf(pdfFile);
  
  // Generate flowchart using Gemini
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });
  
  const systemPrompt = type === 'flowchart' ? 
    `You are a helpful assistant that creates Mermaid flowcharts based on research paper PDF content.
     Create a detailed and well-organized flowchart that represents the overall story of the research paper in great detail.
     Use rounded rectangle nodes (with parentheses syntax) for all nodes.
     Include many detailed nodes and connections to capture the full story of the paper.
     Cover key aspects like: Introduction, Methods, Results, Discussion, and Conclusions.
     Also include relationships between concepts, findings, and implications.
     Format each node with rounded corners and use soft pastel colors.
     Use ONLY Mermaid flowchart syntax.
     Be sure to use the "flowchart TD" directive at the beginning.
     Add style definitions for all nodes to have rounded corners (rx:15,ry:15) and soft colors.
     Return just the Mermaid code for the flowchart, with no additional explanation.` : 
    type === 'mindmap' ? 
    `You are a helpful assistant that creates Mermaid mind maps based on PDF content.
     Create a detailed and well-organized mind map that represents the main concepts and their relationships described in the document.
     Use appropriate node structure with relevant topics and subtopics.
     Use ONLY Mermaid mindmap syntax.
     Be sure to use the "mindmap" directive at the beginning.
     Return just the Mermaid code for the mind map, with no additional explanation.` :
    ``;
  
  try {
    const result = await model.generateContent([
      systemPrompt,
      `Create a detailed ${type} based on the following research paper content:\n\n${text}`
    ]);
    
    const response = await result.response;
    const flowchartCode = response.text();
    
    // Clean up the code - remove any markdown code block syntax
    return flowchartCode.replace(/^```mermaid\s*/g, '').replace(/\s*```$/g, '');
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
};

// Generate a structured summary from PDF content
export const generateStructuredSummary = async (): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  // Extract text from PDF
  const text = await extractTextFromPdf(pdfFile);
  
  // Generate summary using Gemini
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });
  
  try {
    const result = await model.generateContent([
      `You are a helpful assistant that creates structured summaries of research papers.
       Create a detailed summary that covers the following sections:
       1. Title and Authors
       2. Research Question/Objective
       3. Key Methods
       4. Main Findings
       5. Primary Conclusions
       6. Implications and Future Work
       
       Format the summary in Markdown with appropriate headings and bullet points.
       Be concise but comprehensive, focusing on the most important aspects of the paper.`,
      `Create a structured summary based on the following research paper content:\n\n${text}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};

// Get a mind map structure from PDF content
export const generateMindMapFromText = async (text: string): Promise<string> => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });
  
  try {
    const result = await model.generateContent([
      `Create a detailed mind map structure in JSON format based on the following text. The structure should include:
       - A root node with the main topic
       - Primary branches for main categories/sections
       - Secondary branches for sub-topics
       - Tertiary branches for specific details
       
       Format the output as a JSON object with this structure:
       {
         "root": "Main Topic",
         "children": [
           {
             "topic": "Category 1",
             "children": [
               {"topic": "Subtopic 1.1"},
               {"topic": "Subtopic 1.2"}
             ]
           }
         ]
       }`,
      `Text to analyze: ${text}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating mind map structure:", error);
    throw new Error("Failed to generate mind map structure");
  }
};

// Chat with Gemini about PDF content
export const chatWithGeminiAboutPdf = async (query: string): Promise<string> => {
  const pdfFile = getCurrentPdfFile();
  if (!pdfFile) {
    throw new Error("No PDF file found. Please upload a PDF file.");
  }
  
  // Extract text from PDF if not already in context
  const text = await extractTextFromPdf(pdfFile);
  
  // Generate response using Gemini
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });
  
  try {
    const result = await model.generateContent([
      `You are a helpful research assistant that answers questions about research papers.
       You'll be given the content of a research paper, followed by a question.
       Answer the question based on the paper content.
       If the answer isn't in the paper, say so rather than making something up.
       Format your answer using Markdown for clarity, with headers, lists, and emphasis where appropriate.`,
      `Research paper content:\n\n${text}\n\nQuestion: ${query}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};
