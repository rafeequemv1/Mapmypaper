import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.VERTEX_AI_PROJECT_ID || "",
  location: process.env.VERTEX_AI_LOCATION || "",
});

// Access the Gemini 1.5 Pro model
const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro-005',
  generation_config: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 1,
  },
  safety_settings: [{
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }],
});

const mindmapPrompt = (text: string) => `
Analyze the following text from a research paper and extract the key concepts, ideas, and relationships.
Create a mind map diagram in Mermaid syntax that visually represents these elements.
The root node should be the main topic of the paper, and the subsequent levels should branch out to subtopics, supporting ideas, and relevant details.
Use clear and concise labels for each node, and ensure that the connections between nodes accurately reflect the relationships in the text.
Incorporate citations where appropriate.
Text:
${text}
`;

const treemapPrompt = (text: string) => `
Analyze the following text from a research paper and extract the key themes, categories, and their relative importance.
Create a treemap diagram in Mermaid syntax that visually represents these elements.
The size of each rectangle in the treemap should correspond to the weight or importance of the theme/category in the paper.
Use clear and concise labels for each rectangle, and ensure that the hierarchy and sizing accurately reflect the information in the text.
Incorporate citations where appropriate.
Text:
${text}
`;

export async function generateMermaidDiagram(type: string, text: string) {
  let prompt = "";
  if (type === "mindmap") {
    prompt = mindmapPrompt(text);
  } else if (type === "treemap") {
    prompt = treemapPrompt(text);
  } else {
    throw new Error(`Invalid visualization type: ${type}`);
  }
  
  try {
    const streamingResp = await model.generateContentStream({
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
    });
    
    let fullText = "";
    for await (const chunk of streamingResp.stream) {
      fullText += chunk.text();
    }
    
    // Check if the response contains the code block delimiters
    const startDelimiter = "```mermaid";
    const endDelimiter = "```";
    
    const startIndex = fullText.indexOf(startDelimiter);
    const endIndex = fullText.indexOf(endDelimiter, startIndex + startDelimiter.length);
    
    if (startIndex !== -1 && endIndex !== -1) {
      // Extract the Mermaid code from the response
      const mermaidCode = fullText.substring(startIndex + startDelimiter.length, endIndex).trim();
      return mermaidCode;
    } else {
      // If delimiters are not found, return the full text as is
      console.warn("Mermaid code delimiters not found in the response.");
      return fullText.trim();
    }
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
}

export async function generateMindMapFromText(text: string) {
  const mindMapData = {
    "format": "mindmap",
    "theme": "fresh-blue",
    "author": "mapmypaper",
    "version": "1.4.4",
    "root": {
      "id": "root",
      "topic": "Main Topic",
      "style": {
        "background": "#13795A",
        "color": "white"
      },
      "children": [
        {
          "id": "1",
          "topic": "Subtopic 1",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        },
        {
          "id": "2",
          "topic": "Subtopic 2",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        },
        {
          "id": "3",
          "topic": "Subtopic 3",
          "style": {
            "background": "#13795A",
            "color": "white"
          }
        }
      ]
    }
  };
  
  return mindMapData;
}
