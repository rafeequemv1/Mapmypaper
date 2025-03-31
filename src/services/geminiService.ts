
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
    
    if (!pdfText) {
      throw new Error("No PDF text found. Please upload a PDF first.");
    }

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
    
    console.log("Flowchart generated successfully");
    
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
