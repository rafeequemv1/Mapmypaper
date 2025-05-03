
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { toast } from "sonner";

// Initialize the API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Updated model name to use correctly supported versions
const modelName = "gemini-1.5-flash";  // Updated from gemini-1.0-pro
const visionModelName = "gemini-1.5-flash-vision";  // For handling images

// Create the model instances
const model = genAI.getGenerativeModel({
  model: modelName,
  safetySettings: [
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
  ],
});

const visionModel = genAI.getGenerativeModel({
  model: visionModelName,
  safetySettings: [
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
  ],
});

interface MindNode {
  id: string;
  topic: string;
  direction?: number;
  children?: MindNode[];
}

interface MindMapData {
  nodeData: MindNode;
}

export async function generateMindMapFromText(text: string): Promise<MindMapData> {
  try {
    const prompt = `
    You are an expert at creating mind maps for academic papers and research documents. Based on the text provided:

    1. Extract the key topics and subtopics
    2. Structure them in a hierarchical tree format
    3. Use emojis at the beginning of topics where appropriate
    4. Keep topic names concise but informative
    5. Include all important sections from the paper
    
    Respond ONLY with JSON representing a mind map with this structure:
    {
      "nodeData": {
        "id": "root",
        "topic": "Main Topic",
        "children": [
          {
            "id": "child1",
            "topic": "Subtopic 1",
            "direction": 0,
            "children": [
              { "id": "child1-1", "topic": "Detail point 1" }
            ]
          },
          {
            "id": "child2",
            "topic": "Subtopic 2",
            "direction": 1,
            "children": []
          }
        ]
      }
    }

    Direction values: 0 = left side of mind map, 1 = right side of mind map

    The text to analyze is:
    ${text.substring(0, 100000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    console.log("Raw Gemini response:", rawText);

    // Extract JSON from the response - it might be enclosed in triple backticks
    let jsonText = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    }

    try {
      // Parse the JSON response
      const mindMapData = JSON.parse(jsonText);
      
      // Validate the structure minimally
      if (!mindMapData || !mindMapData.nodeData || !mindMapData.nodeData.id) {
        throw new Error("Invalid mind map structure returned");
      }
      
      console.log("Mind map data generated successfully");
      return mindMapData;
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      throw new Error("Failed to parse mind map data");
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw new Error(`Failed to generate mind map: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to analyze an image with Gemini
export const analyzeImageWithGemini = async (imageData: string, prompt?: string) => {
  try {
    const userPrompt = prompt || "Describe what you see in this image in detail. If it's a part of a research paper or document, analyze the content and explain what it shows.";
    
    // Generate content with the image as part of the input
    const parts = [
      { text: userPrompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.split(',')[1] // Remove the data:image/jpeg;base64, prefix
        }
      }
    ];

    // Generate content from the vision model using the correct format
    const result = await visionModel.generateContent(parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to explain selected text
export const explainSelectedText = async (text: string, mode: string = "explain") => {
  try {
    let prompt = "";
    
    switch (mode) {
      case "explain":
        prompt = `You are an academic assistant helping a researcher understand a complex paper. 
        Explain the following text in simpler terms while preserving all the important information:
        
        "${text}"
        
        Provide a clear, concise explanation that would help someone understand this concept.`;
        break;
        
      case "summarize":
        prompt = `Summarize the following text from an academic paper in a concise way:
        
        "${text}"
        
        Create a brief summary that captures the key points.`;
        break;
        
      case "critique":
        prompt = `You are a critical academic reviewer. Analyze the following text from a research paper:
        
        "${text}"
        
        Provide a constructive critique discussing the strengths and potential weaknesses of this content.`;
        break;
        
      default:
        prompt = `Explain the following text in clear terms:
        
        "${text}"`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Error in ${mode} mode with Gemini:`, error);
    throw new Error(`Failed to process text: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to chat with Gemini about a PDF
export const chatWithGeminiAboutPdf = async (
  message: string, 
  pdfText: string | null = null, 
  chatHistory: { role: "user" | "model"; content: string }[] = []
) => {
  try {
    let prompt = message;
    
    // If we have PDF text to provide context
    if (pdfText) {
      // Trim PDF text if it's too long
      const trimmedPdfText = pdfText.length > 15000 
        ? pdfText.substring(0, 15000) + "... (text truncated due to length)"
        : pdfText;
      
      prompt = `I'm asking about a PDF document with the following content:
      ---
      ${trimmedPdfText}
      ---
      
      Based on this content, please answer: ${message}`;
    }
    
    // Create a chat session with history
    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    // Send the message
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error chatting with Gemini about PDF:", error);
    throw new Error(`Failed to get response: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to generate structured summary from PDF text
export const generateStructuredSummary = async (text: string) => {
  try {
    const prompt = `
    You are a professional academic summarizer who creates detailed, structured summaries of research papers and documents.
    
    Please analyze the following text and create a comprehensive summary with the following sections, adapting them based on the document type:
    
    For research papers:
    - Summary: A concise overview of the entire document with key takeaways.
    - Key Findings: The main results and discoveries.
    - Methods: The approach used in the research.
    - Significance: Why this research matters.
    - Limitations: Constraints or weaknesses of the study.
    
    For business documents:
    - Summary: A concise overview of the entire document with key takeaways.
    - Business Context: The business situation or problem being addressed.
    - Key Points: Main arguments or information presented.
    - Financial Implications: Any monetary or resource considerations.
    - Action Items: Recommended next steps.
    
    For legal documents:
    - Summary: A concise overview of the entire document with key takeaways.
    - Legal Framework: The laws or regulations involved.
    - Parties & Obligations: Who is involved and what they must do.
    - Key Clauses: Important provisions or terms.
    - Potential Issues: Possible legal concerns or ambiguities.
    
    Choose the most appropriate structure based on the document type, and use [citation:pageX] format to reference specific pages where appropriate.
    
    Document text:
    ${text.substring(0, 15000)}... (text truncated for processing)
    `;

    // Generate the summary
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Try to parse the response as structured data
    try {
      // First try to handle the case where the response is a properly formatted JSON
      if (responseText.includes('{') && responseText.includes('}')) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      // If not JSON, parse the sections manually
      const sections: Record<string, string> = { 
        Summary: "" 
      };
      
      // Split by markdown headers
      const sectionMatches = responseText.split(/##\s+([^#\n]+)/);
      
      // Process the sections
      for (let i = 1; i < sectionMatches.length; i += 2) {
        if (i + 1 < sectionMatches.length) {
          const sectionName = sectionMatches[i].trim();
          const sectionContent = sectionMatches[i + 1].trim();
          sections[sectionName] = sectionContent;
        }
      }
      
      // If no sections were found using ## headers, try with headings in the text
      if (Object.keys(sections).length <= 1) {
        const lines = responseText.split('\n');
        let currentSection = "Summary";
        sections[currentSection] = "";
        
        for (const line of lines) {
          // Check if this line looks like a section heading
          if (line.match(/^[A-Z][A-Za-z\s]+:/) || line.match(/^[A-Z][A-Za-z\s]+$/)) {
            currentSection = line.replace(':', '').trim();
            sections[currentSection] = "";
          } else if (currentSection) {
            sections[currentSection] += line + "\n";
          }
        }
      }
      
      // Clean up the sections
      Object.keys(sections).forEach(key => {
        sections[key] = sections[key].trim();
      });
      
      return sections;
    } catch (e) {
      // If parsing fails, return the plain text
      console.error("Failed to parse structured summary:", e);
      return { Summary: responseText };
    }
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Function to generate a mermaid flowchart from text
export const generateFlowchartFromText = async (text: string) => {
  try {
    const prompt = `
    You are an expert at creating mermaid.js flowcharts for academic papers and research documents.
    
    Based on the text provided, create a mermaid.js flowchart that:
    1. Visualizes the key processes, methods, or workflows described in the document
    2. Uses appropriate flowchart symbols and connections
    3. Is well-structured and easy to follow
    4. Includes only the most important elements (maximum 15 nodes)
    5. Uses descriptive but concise node labels
    
    Respond ONLY with valid mermaid.js flowchart syntax, nothing else. Use the flowchart LR (left to right) or TD (top down) format depending on which better suits the content.
    
    Example of expected output format:
    \`\`\`mermaid
    flowchart TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Process 1]
      B -->|No| D[Process 2]
      C --> E[End]
      D --> E
    \`\`\`
    
    The text to analyze is:
    ${text.substring(0, 12000)}... (text truncated for processing)
    `;

    // Generate the flowchart
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract just the mermaid code
    const mermaidMatch = responseText.match(/```mermaid\s*([\s\S]*?)```/);
    if (mermaidMatch && mermaidMatch[1]) {
      return mermaidMatch[1].trim();
    }
    
    // If no mermaid code block is found, check if the response is already just mermaid code
    if (responseText.includes('flowchart') || responseText.includes('graph')) {
      return responseText.trim();
    }
    
    throw new Error("Failed to generate valid mermaid flowchart");
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw new Error(`Failed to generate flowchart: ${error instanceof Error ? error.message : String(error)}`);
  }
};
