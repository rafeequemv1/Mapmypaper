
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Updated model names for the current API version
// Gemini Pro Vision model
const modelVision = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

// Gemini Pro model (text-only)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Function to test the Gemini API connection
export const testGeminiConnection = async (): Promise<boolean> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.error("API key not found in environment variables");
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
  
  try {
    console.log("Testing connection to Gemini API...");
    const result = await model.generateContent("Hello, this is a test message to verify the API connection.");
    const response = await result.response;
    console.log("Gemini API connection successful:", response.text().substring(0, 50) + "...");
    return true;
  } catch (error) {
    console.error("Gemini API connection test failed:", error);
    throw error;
  }
};

// Function to get the Gemini model
const getGeminiModel = async () => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.error("API key not found in environment variables");
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
  return model;
};

/**
 * Sends a chat request to Gemini with the given prompt and PDF content.
 * @param prompt The user's question or prompt.
 * @returns The response text from Gemini.
 */
export const chatWithGeminiAboutPdf = async (prompt: string): Promise<string> => {
  try {
    const gemini = await getGeminiModel();
    const result = await gemini.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
};

/**
 * Analyzes an image with the Gemini Pro Vision model.
 * @param imageBase64 The base64 encoded image data.
 * @returns The response text from Gemini.
 */
export const analyzeImageWithGemini = async (imageBase64: string): Promise<string> => {
  try {
    if (!imageBase64) {
      throw new Error("Image data is required.");
    }

    const geminiVision = modelVision;
    const result = await geminiVision.generateContent([
      "Analyze the content of this image in detail.",
      imageBase64,
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    throw error;
  }
};

/**
 * Explains a selected text from a PDF using Gemini
 * @param selectedText The text selected by the user
 * @returns The explanation of the selected text
 */
export const explainSelectedText = async (selectedText: string): Promise<string> => {
  try {
    if (!selectedText || typeof selectedText !== 'string' || selectedText.trim() === '') {
      throw new Error("Valid selected text is required.");
    }
    
    console.log(`Explaining selected text (length: ${selectedText.length} characters)`);
    
    const prompt = `
      Please explain the following text in clear, simple terms. If it contains academic or technical 
      concepts, provide definitions and context. Use bullet points where appropriate.
      
      Selected text:
      "${selectedText}"
      
      Provide your explanation with relevant emojis and citations if applicable.
    `;
    
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error explaining selected text:", error);
    throw new Error(`Failed to explain selected text: ${error.message}`);
  }
};

/**
 * Generates a mind map structure from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A JSON structure representing the mind map
 */
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    console.log(`Processing PDF text length: ${pdfText.length} characters`);
    
    // Ensure we have a valid API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error("Missing Gemini API key");
      throw new Error("VITE_GEMINI_API_KEY is not set in environment variables");
    }
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a mind map structure in JSON format.
      Focus on identifying the main topics, key concepts, and their relationships.
      Use emojis at the start of topics to represent the content.
      
      Document text excerpt:
      ${truncatedText}
      
      Return ONLY valid JSON without any explanation or formatting.
      The JSON must have this structure for direct compatibility with mind-elixir:
      {
        "nodeData": {
          "id": "root",
          "topic": "Main Document Title",
          "children": [
            {
              "id": "bd1",
              "topic": "🔍 Introduction",
              "direction": 0,
              "children": [
                {"id": "bd1-1", "topic": "📘 Background"}
              ]
            },
            {
              "id": "bd2",
              "topic": "⚙️ Methodology",
              "direction": 0,
              "children": []
            }
          ]
        }
      }
    `;
    
    console.log("Sending request to Gemini API for mindmap generation...");
    const geminiModel = await getGeminiModel();
    
    // Set a timeout for the API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API request timed out after 30 seconds")), 30000);
    });
    
    // Race between the actual API call and the timeout
    const result = await Promise.race([
      geminiModel.generateContent(prompt),
      timeoutPromise
    ]) as any;
    
    const response = await result.response;
    const jsonText = response.text();
    
    console.log("Received response from Gemini API, parsing JSON...");
    console.log("Raw response first 200 chars:", jsonText.substring(0, 200));
    
    try {
      // Try to clean the JSON text by removing any markdown formatting
      let cleanedJsonText = jsonText;
      
      // Remove markdown code block syntax if present
      cleanedJsonText = cleanedJsonText.replace(/```(json)?|```/g, '');
      
      // Trim whitespace
      cleanedJsonText = cleanedJsonText.trim();
      
      console.log("Cleaned JSON first 200 chars:", cleanedJsonText.substring(0, 200));
      
      const parsedJson = JSON.parse(cleanedJsonText);
      console.log("Successfully parsed JSON response for mindmap");
      
      // Ensure the structure matches what mind-elixir expects
      if (!parsedJson.nodeData) {
        // If the API returned just the root object without the nodeData wrapper
        if (parsedJson.id === "root" && parsedJson.topic && Array.isArray(parsedJson.children)) {
          return { nodeData: parsedJson };
        }
        
        // If root is inside a "root" property (sometimes happens)
        if (parsedJson.root && parsedJson.root.topic && Array.isArray(parsedJson.root.children)) {
          return { nodeData: parsedJson.root };
        }
      }
      
      return parsedJson;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.log("Raw response:", jsonText);
      
      // Return a default mind map structure with an error message
      return {
        nodeData: {
          id: "root",
          topic: "📄 Document Analysis",
          children: [
            { 
              id: "error",
              topic: "⚠️ API Processing Error",
              direction: 0,
              children: [
                { 
                  id: "error-1", 
                  topic: "Could not generate mindmap from document. Please check your API key and try again."
                },
                {
                  id: "error-2",
                  topic: "Raw API Response",
                  children: [
                    {
                      id: "error-2-1",
                      topic: jsonText.substring(0, 500) + (jsonText.length > 500 ? "..." : "")
                    }
                  ]
                }
              ]
            },
            {
              id: "default",
              topic: "📋 Document Structure",
              direction: 1,
              children: [
                { 
                  id: "default-1", 
                  topic: "Upload or select a PDF to analyze its structure" 
                }
              ]
            }
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map from text:", error);
    
    // Return a structured error message as a mindmap
    return {
      nodeData: {
        id: "root",
        topic: "⚠️ Error Processing Document",
        children: [
          { 
            id: "error1", 
            topic: `API Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            direction: 0 
          },
          { 
            id: "solution", 
            topic: "💡 Possible solutions",
            direction: 1,
            children: [
              { id: "solution1", topic: "Check your internet connection" },
              { id: "solution2", topic: "Verify your Gemini API key is valid" },
              { id: "solution3", topic: "Make sure VITE_GEMINI_API_KEY is set in .env file" },
              { id: "solution4", topic: "Try uploading a different PDF" }
            ] 
          }
        ]
      }
    };
  }
};

/**
 * Generates a structured summary from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 */
export const generateStructuredSummary = async (pdfText: string): Promise<any> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a structured summary.
      Include the following sections:
      - Key Findings
      - Main Arguments
      - Methodology
      - Conclusions
      - Limitations (if mentioned)
      
      Document text excerpt:
      ${truncatedText}
      
      Format the response with markdown headings for each section.
    `;
    
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate structured summary from text: ${error.message}`);
  }
};

/**
 * Generates a mermaid flowchart syntax from the extracted PDF text
 * @param pdfText The text extracted from the PDF
 * @returns A mermaid flowchart syntax string
 */
export const generateFlowchartFromText = async (pdfText: string): Promise<string> => {
  try {
    if (!pdfText || typeof pdfText !== 'string') {
      console.error("Invalid PDF text provided:", pdfText);
      throw new Error("Invalid PDF text provided. Text must be a non-empty string.");
    }
    
    // We'll use the first 10000 characters only to avoid token limits
    const truncatedText = pdfText.slice(0, 10000);
    
    const prompt = `
      Based on the following text from a research document, create a mermaid.js flowchart syntax that represents the document's structure. 
      Focus on identifying the main sections, their relationships, and key components. 
      Use the graph TD (top-down) or LR (left-right) format.
      Make the chart concise and readable, limited to the most important 15-20 nodes maximum.
      
      Use proper mermaid.js syntax with node IDs and clear labels.
      Include styling with classDef for important nodes.
      
      Document text excerpt:
      ${truncatedText}
      
      Return ONLY the mermaid syntax without any explanation or markdown code formatting.
      The syntax must begin with 'graph TD' or 'graph LR'.
      Example of valid syntax:
      graph TD
        A[Introduction] --> B[Methods]
        B --> C[Results]
        C --> D[Discussion]
        classDef important fill:#f96,stroke:#333,stroke-width:2px;
        class A,D important;
    `;
    
    console.log("Sending flowchart generation request to Gemini API...");
    const geminiModel = await getGeminiModel();
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let flowchartSyntax = response.text();
    
    console.log("Received flowchart syntax from Gemini API");
    
    // Ensure the flowchart syntax starts with graph TD or graph LR
    flowchartSyntax = flowchartSyntax.replace(/```mermaid|```/g, '').trim();
    
    if (!flowchartSyntax.startsWith('graph TD') && !flowchartSyntax.startsWith('graph LR')) {
      console.warn("Generated syntax doesn't start with graph TD or graph LR, prepending graph TD");
      flowchartSyntax = `graph TD\n${flowchartSyntax}`;
    }
    
    return flowchartSyntax;
  } catch (error) {
    console.error("Error generating flowchart from text:", error);
    // Return a default flowchart for research papers
    return `
      graph TD
        title[Research Paper Structure] --> abstract[Abstract]
        title --> intro[Introduction]
        title --> methods[Methodology]
        title --> results[Results]
        title --> discuss[Discussion]
        title --> concl[Conclusion]
        title --> refs[References]
        
        intro --> background[Background & Context]
        intro --> problem[Problem Statement]
        methods --> design[Research Design]
        methods --> data[Data Collection]
        results --> findings[Key Findings]
        discuss --> interpret[Interpretation]
        concl --> summary[Summary of Findings]
        
        classDef highlight fill:#f9f,stroke:#333,stroke-width:2px;
        class title highlight;
    `;
  }
};
