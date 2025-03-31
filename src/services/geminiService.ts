
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "@/hooks/use-toast";

// Initialize the API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY || "MISSING_API_KEY");

/**
 * Generates a text summary from PDF text using Google Gemini API
 */
export const generateSummaryFromText = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Generate a concise and comprehensive summary of the following document.
      Focus on key points, main arguments, and important findings.
      Format the summary as markdown with sections and bullet points as appropriate.

      DOCUMENT TEXT:
      ${text.substring(0, 50000)}
    `;

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
export const generateMindMapFromText = async (text: string, detailLevel: 'basic' | 'detailed' | 'advanced' = 'detailed') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Check if we have valid text to analyze
    if (!text || text.trim().length < 100) {
      throw new Error("Not enough text to analyze. Please check the PDF extraction.");
    }

    console.log(`Analyzing PDF text for mind map generation. Text length: ${text.length}, Detail level: ${detailLevel}`);

    // Tailor the prompt based on detail level
    let detailInstructions = '';
    if (detailLevel === 'basic') {
      detailInstructions = "Create a simple mind map with only the main topics and key subtopics. Limit the hierarchy to 2 levels deep.";
    } else if (detailLevel === 'detailed') {
      detailInstructions = "Create a detailed mind map with main topics, subtopics, and important details. Use up to 3 levels of hierarchy.";
    } else if (detailLevel === 'advanced') {
      detailInstructions = "Create a comprehensive mind map with extensive details, capturing nuances and relationships between topics. Use up to 4 levels of hierarchy.";
    }

    const prompt = `
      Analyze the following document text and create a structured mind map.
      ${detailInstructions}
      
      The mind map should follow this JSON structure:
      {
        "nodeData": {
          "id": "root",
          "topic": "Main Topic",
          "children": [
            {
              "id": "topic1",
              "topic": "Topic 1",
              "direction": 0,
              "children": [
                {"id": "subtopic1-1", "topic": "Subtopic 1.1"},
                {"id": "subtopic1-2", "topic": "Subtopic 1.2"}
              ]
            },
            {
              "id": "topic2",
              "topic": "Topic 2",
              "direction": 1,
              "children": [
                {"id": "subtopic2-1", "topic": "Subtopic 2.1"},
                {"id": "subtopic2-2", "topic": "Subtopic 2.2"}
              ]
            }
          ]
        }
      }
      
      Ensure you identify the main topic, key concepts, and their relationships. 
      Each node must have a unique "id" and descriptive "topic".
      Direction values alternate between 0 and 1 for visual layout.
      
      DOCUMENT TEXT:
      ${text.substring(0, 50000)}
    `;

    console.log(`Sending document analysis prompt to Gemini with detail level: ${detailLevel}`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mindMapJson = response.text();

    // Extract JSON from the response
    const jsonMatch = mindMapJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the API response");
    }
    
    try {
      // Parse and validate the JSON
      const parsedJson = JSON.parse(jsonMatch[0]);
      
      // Ensure the JSON has the expected structure
      if (!parsedJson.nodeData || !parsedJson.nodeData.children) {
        throw new Error("Invalid mind map structure");
      }
      
      console.log("Mind map generated successfully");
      
      // Store the mind map in session storage for later use
      sessionStorage.setItem('mindMapData', JSON.stringify(parsedJson));
      
      return parsedJson;
    } catch (parseError) {
      console.error("Error parsing mind map JSON:", parseError, jsonMatch[0]);
      throw new Error("Failed to parse mind map data");
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error("Failed to generate mind map from document. Please try again.");
  }
};

/**
 * Generates a flowchart from PDF text using Google Gemini API
 */
export const generateFlowchartFromPdf = async (detailLevel: 'basic' | 'detailed' | 'advanced' = 'detailed') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Get the PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim().length < 100) {
      throw new Error("Not enough text to analyze. Please check the PDF extraction.");
    }

    console.log(`Analyzing PDF text for flowchart generation. Text length: ${pdfText.length}, Detail level: ${detailLevel}`);

    // Customize instructions based on detail level
    let detailInstructions = '';
    if (detailLevel === 'basic') {
      detailInstructions = "Create a simple flowchart showing only the main processes and decision points, limiting to no more than 10 nodes.";
    } else if (detailLevel === 'detailed') {
      detailInstructions = "Create a moderately detailed flowchart showing major processes, decision points, and their relationships.";
    } else if (detailLevel === 'advanced') {
      detailInstructions = "Create a comprehensive flowchart capturing the full complexity of the processes described in the document.";
    }
    
    const prompt = `
      Analyze the following document text and create a flowchart using Mermaid.js syntax.
      ${detailInstructions}
      
      If the text describes a process, workflow, algorithm, or procedure, visualize it as a flowchart.
      If not, identify the main concepts and their relationships and create a logical flow diagram.
      
      Use proper Mermaid.js flowchart syntax. Example:
      
      flowchart TD
          A[Start] --> B{Decision}
          B -->|Yes| C[Process 1]
          B -->|No| D[Process 2]
          C --> E[End]
          D --> E
      
      IMPORTANT RULES:
      1. Use descriptive but concise labels for nodes
      2. Use proper Mermaid.js syntax
      3. Include arrow connections between related nodes
      4. Properly use node shapes: [] for process, {} for decision, () for input/output
      5. Only output valid Mermaid.js flowchart code, no explanations or comments
      
      DOCUMENT TEXT:
      ${pdfText.substring(0, 30000)}
    `;

    console.log("Sending flowchart generation prompt to Gemini");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const flowchartText = response.text();
    
    // Try to extract only the Mermaid code from the response
    const mermaidMatch = flowchartText.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
    const cleanedFlowchart = mermaidMatch ? mermaidMatch[1].trim() : flowchartText.trim();
    
    console.log("Flowchart generated successfully, length:", cleanedFlowchart.length);
    
    return cleanedFlowchart;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    toast({
      title: "Error",
      description: "Failed to generate flowchart. Please try again later.",
      variant: "destructive"
    });
    throw new Error("Failed to generate flowchart from document");
  }
};

/**
 * Explains a selected text from PDF using Google Gemini API
 */
export const explainTextWithGemini = async (selectedText: string) => {
  try {
    // Initialize model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create prompt
    const prompt = `
      Explain the following text in a clear, concise way. 
      If it contains technical terms, define them.
      If it describes a concept, explain it simply.
      If it contains an argument, analyze it.
      
      Format your response with appropriate markdown, 
      including headings, bullet points, and emphasis where helpful.
      
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText) {
      throw new Error("PDF text not found. Please upload a PDF document first.");
    }
    
    // Create a prompt with context from the PDF
    const prompt = `
      You are a helpful research assistant who has read the following document.
      Please respond to the user's question based on the document content.
      
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create prompt for image analysis
    const prompt = `
      Analyze this image from a scientific or academic document.
      Explain what it shows, including:
      - Type of visual (table, chart, graph, diagram, etc.)
      - Main information being conveyed
      - Key data points or findings
      - Any conclusions that can be drawn
      
      Be thorough but concise.
    `;
    
    // Remove data URL prefix if present
    const imageContent = {
      inlineData: {
        data: imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData,
        mimeType: "image/png"
      }
    };
    
    const result = await model.generateContent([prompt, imageContent]);
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
export const generateSequenceDiagramFromPdf = async (detailLevel: 'basic' | 'detailed' | 'advanced' = 'detailed') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText) {
      throw new Error("No PDF text found. Please upload a PDF first.");
    }
    
    // Customize instructions based on detail level
    let detailInstructions = '';
    switch (detailLevel) {
      case 'basic':
        detailInstructions = "Create a simple sequence diagram with only the main actors and key interactions.";
        break;
      case 'detailed':
        detailInstructions = "Create a moderately detailed sequence diagram showing all important actors and their interactions.";
        break;
      case 'advanced':
        detailInstructions = "Create a comprehensive sequence diagram capturing all actors, interactions, and conditions.";
        break;
    }
    
    const prompt = `
      Analyze the following document text and create a sequence diagram using Mermaid.js syntax.
      ${detailInstructions}
      
      If the text describes interactions between different actors, systems, or components, visualize them as a sequence diagram.
      If not, identify the main actors and create a logical sequence of interactions based on the document content.
      
      Use proper Mermaid.js sequence diagram syntax. Example:
      
      sequenceDiagram
          participant User
          participant System
          User->>System: Request data
          System-->>User: Return data
      
      IMPORTANT RULES:
      1. Use descriptive but concise labels for actors
      2. Use proper Mermaid.js sequence diagram syntax
      3. Include all relevant interactions
      4. Only output valid Mermaid.js sequence diagram code, no explanations or comments
      
      DOCUMENT TEXT:
      ${pdfText.substring(0, 30000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const diagramText = response.text();
    
    // Extract only the Mermaid code from the response
    const mermaidMatch = diagramText.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
    const cleanedDiagram = mermaidMatch ? mermaidMatch[1].trim() : diagramText.trim();
    
    return cleanedDiagram;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    throw new Error("Failed to generate sequence diagram from document");
  }
};

/**
 * Generate structured summary from the document
 */
export const generateStructuredSummary = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText) {
      throw new Error("No PDF text found. Please upload a PDF first.");
    }
    
    const prompt = `
      Create a structured summary of the following document.
      
      The summary should be organized into these sections:
      - Overview: Brief description of what the document is about (1-2 sentences)
      - Key Findings: 3-5 bullet points of the most important findings or conclusions
      - Objectives: What the document is trying to achieve or demonstrate
      - Methods: How the research or work was conducted (if applicable)
      - Results: Key results or data presented
      - Conclusions: Final takeaways or implications
      
      Format your response as a JSON object with these section names as keys and the content as values.
      Keep each section concise but informative.
      
      DOCUMENT TEXT:
      ${pdfText.substring(0, 40000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the API response");
    }
    
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Error parsing summary JSON:", parseError);
      
      // Fallback to creating a simple structured object
      return {
        Overview: "Summary could not be properly structured.",
        "Key Findings": summaryText,
        Conclusions: "Please try regenerating the summary."
      };
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error("Failed to generate document summary");
  }
};

