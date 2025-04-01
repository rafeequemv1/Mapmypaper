
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key (now using import.meta.env for Vite instead of process.env)
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

// Function to generate flowchart from PDF
export const generateFlowchartFromPdf = async (detailLevel: 'low' | 'medium' | 'high' = 'medium') => {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    
    if (!pdfText) {
      throw new Error("No PDF text found");
    }
    
    // Limit the text to avoid exceeding token limits
    const limitedText = pdfText.slice(0, 20000);
    
    // Create a prompt based on detail level
    let detailPrompt = '';
    switch(detailLevel) {
      case 'low':
        detailPrompt = 'simple, high-level flowchart with just the main steps (5-8 nodes max)';
        break;
      case 'high':
        detailPrompt = 'detailed flowchart with comprehensive steps and decision points (15-20 nodes)';
        break;
      default:
        detailPrompt = 'moderately detailed flowchart with key steps and some decision points (10-15 nodes)';
    }
    
    const prompt = `
      Create a ${detailPrompt} that visually represents the key processes, methodologies, or frameworks described in this academic paper.
      
      The output MUST be formatted as a Mermaid.js flowchart with the LR (left to right) direction.
      
      Use the following Mermaid.js syntax:
      - Start with 'flowchart LR'
      - Use node definitions like: A[Text in box] or B(Text in rounded box) or C{Decision point}
      - Use arrows like: A --> B or C -->|Yes| D or C -->|No| E
      
      Focus on creating a coherent, logical flow that captures the main process described in the paper.
      DO NOT include any explanation text, just the Mermaid code.
      
      Here's the paper content:
      ${limitedText}
    `;

    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const flowchartCode = response.text().trim();
    
    // Return just the flowchart code
    return flowchartCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error(`Failed to generate flowchart: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to generate mindmap from PDF
export const generateMindmapFromPdf = async () => {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    
    if (!pdfText) {
      throw new Error("No PDF text found");
    }
    
    // Limit the text to avoid exceeding token limits
    const limitedText = pdfText.slice(0, 20000);
    
    const prompt = `
      Create a comprehensive mind map of the academic paper content using Mermaid.js mind map syntax.
      
      The output MUST be formatted as a Mermaid.js mind map.
      
      Use the following syntax:
      - Start with 'mindmap'
      - Use proper indentation to indicate hierarchy
      - Use double parentheses for the root node: ((Root))
      - Use different node shapes: [Square Bracket], (Rounded), {Curly Brace}
      - Include a good hierarchy with multiple levels and branches
      
      Structure the mind map to include:
      1. Central topic (paper title/subject)
      2. Main branches for key sections (e.g., Introduction, Methods, Results, etc.)
      3. Sub-branches for important concepts, findings, and details
      4. Use appropriate depth to capture the hierarchical relationship between concepts
      
      Focus on creating a meaningful structure that helps visualize the paper's content hierarchy.
      DO NOT include any explanation text, just the Mermaid mindmap code.
      
      Here's the paper content:
      ${limitedText}
    `;

    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mindmapCode = response.text().trim();
    
    // Return just the mindmap code
    return mindmapCode;
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw new Error(`Failed to generate mindmap: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to generate sequence diagram from PDF
export const generateSequenceDiagramFromPdf = async () => {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    
    if (!pdfText) {
      throw new Error("No PDF text found");
    }
    
    // Limit the text to avoid exceeding token limits
    const limitedText = pdfText.slice(0, 20000);
    
    const prompt = `
      Create a sequence diagram based on the processes or interactions described in this academic paper.
      
      The output MUST be formatted as a Mermaid.js sequence diagram.
      
      Use the following syntax:
      - Start with 'sequenceDiagram'
      - Define participants: participant A
      - Show interactions: A->>B: Message
      - Include activations, notes, and loops if appropriate
      
      Focus on creating a coherent flow that captures the main sequential processes described in the paper.
      DO NOT include any explanation text, just the Mermaid sequence diagram code.
      
      Here's the paper content:
      ${limitedText}
    `;

    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sequenceDiagramCode = response.text().trim();
    
    // Return just the sequence diagram code
    return sequenceDiagramCode;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error(`Failed to generate sequence diagram: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to chat with Gemini about PDF content
export const chatWithGeminiAboutPdf = async (userQuery: string) => {
  try {
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem("pdfData") || sessionStorage.getItem("uploadedPdfData");
    
    if (!pdfText) {
      throw new Error("No PDF text found to analyze");
    }
    
    // Limit the text to avoid exceeding token limits
    const limitedText = pdfText.slice(0, 20000);
    
    const prompt = `
      As a research assistant, your task is to answer questions about this academic paper. 
      The user's query is: "${userQuery}"
      
      When answering:
      1. Be concise but thorough
      2. If the exact answer isn't in the text, say so rather than making something up
      3. Use [citation:pageX] format to reference where information comes from in the paper
      4. When appropriate, structure your response with headings and bullet points
      
      Here's the paper content:
      ${limitedText}
    `;

    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    
    return answer;
  } catch (error) {
    console.error("Error chatting with Gemini:", error);
    throw new Error(`Failed to get answer: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to generate mind map from text
export const generateMindMapFromText = async (text: string) => {
  try {
    if (!text || text.trim() === '') {
      throw new Error("No text provided");
    }
    
    // Store the extracted text for other functions to use
    sessionStorage.setItem("pdfText", text);
    
    // Limit the text to avoid exceeding token limits
    const limitedText = text.slice(0, 20000);
    
    // Create a basic mind map structure based on text analysis
    const prompt = `
      Analyze this academic paper and create a structured outline with these sections:
      
      1. Summary
      2. Key Objectives
      3. Methodology
      4. Results
      5. Conclusions
      6. Key Concepts
      
      For each section, include 3-5 bullet points with the most important information.
      
      Paper text:
      ${limitedText}
    `;
    
    // Generate content using the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mindMapData = response.text();
    
    // Return the structured data
    return {
      title: "Paper Analysis",
      content: mindMapData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    return {
      title: "Error Processing Document",
      content: "There was an error processing your document. Please try again.",
      timestamp: new Date().toISOString()
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
