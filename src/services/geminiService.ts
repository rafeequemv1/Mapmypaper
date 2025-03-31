
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "@/hooks/use-toast";

// Initialize the API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "MISSING_API_KEY");

/**
 * Generates a text summary from PDF text using Google Gemini API
 */
export const generateSummaryFromText = async (pdfText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    // Create prompt
    const prompt = `
      Summarize the following text from a PDF document. 
      Focus on the key points, main arguments, and important conclusions.
      
      TEXT TO SUMMARIZE:
      ${pdfText}
    `;
    
    console.log("Sending summary prompt to Gemini");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary. Please try again later.");
  }
};

/**
 * Generates a mind map data structure from PDF text using Google Gemini API
 */
export const generateMindMapFromText = async (pdfText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    // Create prompt
    const prompt = `
      Analyze the following text from a PDF document and extract the key concepts, ideas, and relationships.
      Create a mind map data structure in JSON format that represents these concepts and their connections.
      The root node should be the main topic of the document.
      Each child node should represent a key concept or idea.
      The children of each concept should represent sub-concepts or related ideas.
      Include a "direction" property for each node to indicate whether it should be placed on the left or right side of the mind map.
      
      TEXT TO ANALYZE:
      ${pdfText}
      
      JSON FORMAT:
      {
        "nodeData": {
          "id": "root",
          "topic": "Main Topic",
          "children": [
            {
              "id": "1",
              "topic": "Concept 1",
              "direction": 0,
              "children": [
                { "id": "1.1", "topic": "Sub-concept 1.1" },
                { "id": "1.2", "topic": "Sub-concept 1.2" }
              ]
            },
            {
              "id": "2",
              "topic": "Concept 2",
              "direction": 1,
              "children": [
                { "id": "2.1", "topic": "Sub-concept 2.1" },
                { "id": "2.2", "topic": "Sub-concept 2.2" }
              ]
            }
          ]
        }
      }
    `;
    
    console.log("Sending mind map prompt to Gemini");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mindMapJson = response.text();
    
    try {
      // Parse the JSON string into a JavaScript object
      const mindMapData = JSON.parse(mindMapJson);
      return mindMapData;
    } catch (parseError) {
      console.error("Error parsing mind map JSON:", parseError);
      console.log("Invalid JSON:", mindMapJson);
      throw new Error("Failed to parse mind map JSON. Please try again later.");
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map. Please try again later.");
  }
};

/**
 * Generates a flowchart from PDF text using Google Gemini API
 */
export const generateFlowchartFromPdf = async (pdfText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    // Create prompt - fixing the backtick escaping issue
    const prompt = `
      Analyze the following text from a PDF document and extract the key steps, decisions, and processes.
      Create a flowchart diagram in Mermaid syntax that represents these steps and their connections.
      
      TEXT TO ANALYZE:
      ${pdfText}
      
      MERMAID SYNTAX:
      \`\`\`mermaid
      graph LR
          A[Start] --> B{Decision}
          B -- Yes --> C[Process 1]
          B -- No --> D[Process 2]
          C --> E[End]
          D --> E
      \`\`\`
    `;
    
    console.log("Sending flowchart prompt to Gemini");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const flowchart = response.text();
    
    return flowchart;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error("Failed to generate flowchart. Please try again later.");
  }
};

/**
 * Explains a selected text from PDF using Google Gemini API
 */
export const explainTextWithGemini = async (selectedText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    // Create prompt
    const prompt = `
      Explain the following text in a clear, concise way. 
      If it contains technical terms, define them.
      If it describes a concept, explain it simply.
      If it contains an argument, analyze it.
      
      Format your response with appropriate markdown, 
      including headings, bullet points, and emphasis where helpful.
      Always include a brief summary at the beginning in 1-2 sentences.
      
      TEXT TO EXPLAIN:
      "${selectedText}"
    `;
    
    console.log("Sending explanation prompt to Gemini");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();
    
    return explanation;
  } catch (error) {
    console.error("Error explaining text:", error);
    throw new Error("Failed to generate explanation. Please try again later.");
  }
};

/**
 * Chat with Gemini about the uploaded PDF
 */
export const chatWithGeminiAboutPdf = async (message: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    const pdfText = sessionStorage.getItem('pdfText');
    if (!pdfText) {
      throw new Error("PDF text not found. Please upload a PDF document first.");
    }
    
    // Create a prompt with context from the PDF
    const prompt = `
      You are a helpful research assistant who has read the following document.
      Please respond to the user's question based on the document content.
      
      Always format your response with clear headings, bullet points for lists, 
      and proper markdown formatting. Make sure your answer is easy to read.
      
      DOCUMENT CONTENT (partial):
      ${pdfText.substring(0, 15000)}
      
      USER QUESTION:
      ${message}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat with Gemini:", error);
    throw new Error("Failed to get a response from the AI assistant.");
  }
};

/**
 * Analyze an image with Gemini Vision API
 */
export const analyzeImageWithGemini = async (imageData: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });
    
    // Create prompt for image analysis
    const prompt = `
      Analyze this image from a scientific or academic document.
      Explain what it shows, including:
      - Type of visual (table, chart, graph, diagram, etc.)
      - Main information being conveyed
      - Key data points or findings
      - Any conclusions that can be drawn
      
      Format your response with:
      # Summary
      (Brief overview in 1-2 sentences)
      
      ## Type of Visual
      (Identify what kind of visual this is)
      
      ## Key Information
      (Bullet points of main information)
      
      ## Analysis
      (Detailed explanation)
      
      Be thorough but concise.
    `;
    
    // Remove data URL prefix if present
    const imageContent = {
      inlineData: {
        data: imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData,
        mimeType: "image/png"
      }
    };
    
    const result = await model.generateContent([
      prompt,
      imageContent
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to analyze the image. Please try again.");
  }
};

/**
 * Generate sequence diagram for document processes
 */
export const generateSequenceDiagramFromPdf = async (pdfText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });

    // Create prompt
    const prompt = `
      Analyze the following text from a PDF document and extract the key processes, actors, and interactions.
      Create a sequence diagram in Mermaid syntax that represents these processes and their interactions.

      TEXT TO ANALYZE:
      ${pdfText}

      MERMAID SYNTAX:
      \`\`\`mermaid
      sequenceDiagram
        participant A as Actor 1
        participant B as Actor 2
        A->>B: Action 1
        B-->>A: Response 1
        A->>A: Internal Action
      \`\`\`
    `;

    console.log("Sending sequence diagram prompt to Gemini");

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sequenceDiagram = response.text();

    return sequenceDiagram;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error("Failed to generate sequence diagram. Please try again later.");
  }
};

/**
 * Generate structured summary from the document
 */
export const generateStructuredSummary = async (pdfText: string) => {
    try {
        // Initialize model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro"
        });

        // Create prompt
        const prompt = `
        Analyze the following text from a PDF document and extract the key sections, including:
        - Abstract
        - Introduction
        - Methods
        - Results
        - Discussion
        - Conclusion

        Create a structured summary in JSON format that represents these sections and their content.

        TEXT TO ANALYZE:
        ${pdfText}

        JSON FORMAT:
        {
            "Abstract": "Summary of the abstract",
            "Introduction": "Summary of the introduction",
            "Methods": "Summary of the methods section",
            "Results": "Summary of the results section",
            "Discussion": "Summary of the discussion section",
            "Conclusion": "Summary of the conclusion section"
        }
        `;

        console.log("Sending structured summary prompt to Gemini");

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const structuredSummaryJson = response.text();

        try {
            // Parse the JSON string into a JavaScript object
            const structuredSummaryData = JSON.parse(structuredSummaryJson);
            return structuredSummaryData;
        } catch (parseError) {
            console.error("Error parsing structured summary JSON:", parseError);
            console.log("Invalid JSON:", structuredSummaryJson);
            throw new Error("Failed to parse structured summary JSON. Please try again later.");
        }
    } catch (error) {
        console.error("Error generating structured summary:", error);
        throw new Error("Failed to generate structured summary. Please try again later.");
    }
};
