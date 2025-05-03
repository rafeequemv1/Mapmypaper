
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, Part } from "@google/generative-ai";
import { enhanceMindMapWithEmojis } from "../utils/mindMapUtils";

// Initialize the Gemini API with the provided API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Configure safety settings to allow academic content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
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
];

// Generation config
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

// This extracts text from PDFs and generates a mind map structure
export async function generateMindMapFromText(pdfText: string) {
  try {
    // Truncate text if it's too long (Gemini has input token limits)
    let processedText = pdfText;
    if (pdfText.length > 30000) {
      console.log("Text too long, truncating to 30,000 characters");
      processedText = pdfText.substring(0, 30000);
    }

    // Create the model instance
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig,
    });

    // Enhanced prompt engineering for more detailed content extraction with emojis
    const prompt = `
      You are an expert in creating highly detailed and visually engaging hierarchical mind maps from academic papers.
      
      I'll provide you with text extracted from a PDF research paper. Your task is to carefully read this text and create a HIGHLY DETAILED mind map structure with EXTENSIVE CONTENT from the paper.
      
      Create a JSON structure that follows the Mind-Elixir format:
      
      {
        "nodeData": {
          "id": "root",
          "topic": "🔍 ACTUAL_PAPER_TITLE", // Extract the actual title and add an appropriate emoji
          "children": [
            {
              "id": "a unique id",
              "topic": "EMOJI SECTION_CONTENT", // Add relevant emoji + real content from the paper
              "direction": 0,  // 0 for left branches, 1 for right branches
              "children": [] // Highly detailed nested concepts with actual paper content
            }
          ]
        }
      }
      
      SPECIFIC REQUIREMENTS:
      1. ADD EMOJIS to EVERY topic node based on its content - use a relevant emoji that matches each topic
      2. Extract and use the ACTUAL TITLE of the paper for the root node (with emoji)
      3. Create a DEEP HIERARCHY with at least 3-4 levels of nested nodes for important sections
      4. Include AT LEAST 5-7 main branches (sections from the paper)
      5. Each main section should have AT LEAST 4-6 subsections
      6. For important sections, create even deeper hierarchies with 3rd and 4th level nodes
      7. Use REAL CONTENT from the paper for all topics - NOT generic placeholders
      8. Include specific facts, findings, methodologies, and key terminology mentioned in the paper
      9. Structure should reflect the paper's actual organization and flow of ideas
      10. Use concise but informative node labels that capture the essence of each concept
      11. Balance the mind map visually with roughly equal nodes on both sides
      12. Use "direction": 0 for left branches and "direction": 1 for right branches
      13. For research papers, typical left branches include Introduction, Literature Review, Methodology
      14. For research papers, typical right branches include Results, Discussion, Conclusion
      15. Include unique alphanumeric IDs for each node
      
      IMPORTANT FORMATTING GUIDELINES:
      - Keep node topics concise but specific (3-7 words is ideal)
      - Every node MUST start with an appropriate emoji that reflects its content
      - Add formatting like "✅" for key findings, "❌" for limitations, "⚠️" for warnings
      - Ensure all content is factual and actually present in the paper
      
      DO NOT RETURN ANY EXPLANATIONS, just the valid JSON.
      
      Here's the text: 
      ${processedText}
    `;

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse the JSON from the response
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks 
      const jsonMatch = responseText.match(/```(?:json)?([\s\S]*)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      const mindMapData = JSON.parse(jsonString);
      
      // Enhance the mind map with additional emojis where missing
      const enhancedMindMap = enhanceMindMapWithEmojis(mindMapData);
      
      return enhancedMindMap;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Generated response was not valid JSON");
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw error;
  }
}

// Generate a flowchart using Mermaid syntax
export async function generateFlowchartFromText(text: string): Promise<string> {
  try {
    // Truncate text if it's too long
    let processedText = text;
    if (text.length > 30000) {
      console.log("Text too long for flowchart generation, truncating to 30,000 characters");
      processedText = text.substring(0, 30000);
    }

    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig
    });

    // Prompt for flowchart generation
    const prompt = `
      You are an expert in creating visual representations of document structures.
      
      Analyze the following text from a research paper or document and create a flowchart that maps out its structure
      using Mermaid flowchart syntax (graph TD). The flowchart should clearly show:
      
      1. The main sections of the document
      2. Key subsections and their relationships
      3. Important components within each section
      
      Focus on creating a clean, hierarchical structure that helps visualize how the document is organized.
      
      Do not include the document's detailed content - instead focus on the structural elements.
      
      Return ONLY valid Mermaid syntax that would generate a good flowchart (TD direction).
      The output should start with "graph TD" and use proper Mermaid syntax.
      
      Here's the document text:
      ${processedText}
    `;

    // Generate the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Clean the response to ensure it's valid Mermaid syntax
    const mermaidMatch = responseText.match(/```(?:mermaid)?([\s\S]*)```/);
    const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : responseText.trim();
    
    // Ensure the code starts with graph TD
    if (!mermaidCode.startsWith('graph TD')) {
      return 'graph TD\n' + mermaidCode;
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating flowchart:", error);
    throw error;
  }
}

// Chat with Gemini about a PDF
export async function chatWithGeminiAboutPdf(
  question: string,
  pdfText: string = "", // Make pdfText optional with default empty string
  chatHistory: Array<{ role: string; parts: string }> = []
): Promise<string> {
  try {
    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig
    });

    // Truncate text if too long
    let processedPdfText = pdfText;
    if (pdfText && pdfText.length > 25000) {
      console.log("PDF text too long, truncating to 25,000 characters");
      processedPdfText = pdfText.substring(0, 25000);
    }

    // Create chat session with history
    const chat = model.startChat({
      history: chatHistory.map(entry => ({
        role: entry.role as "user" | "model",
        parts: [{ text: entry.parts }]
      })),
      generationConfig,
      safetySettings,
    });

    // Create the context-rich prompt
    let prompt = question;
    
    // Only add PDF context if provided
    if (processedPdfText) {
      prompt = `
        I'm going to ask you questions about a document. Here's the document content:
        
        ${processedPdfText}
        
        My question is: ${question}
        
        Please provide a detailed answer based on the document content. If the answer isn't in the document, say so.
        If you're referring to specific parts of the document, add references like [Page X] or use quotation marks.
      `;
    }

    // Generate response
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat with Gemini:", error);
    throw error;
  }
}

// Analyze an image with Gemini
export async function analyzeImageWithGemini(
  imageData: string,
  question: string = "What does this image show? Please describe it in detail."
): Promise<string> {
  try {
    // Create model specifically for vision tasks
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-vision",
      safetySettings,
      generationConfig
    });

    // Clean up the base64 string if needed
    let cleanImageData = imageData;
    if (imageData.includes('base64,')) {
      cleanImageData = imageData.split('base64,')[1];
    }

    // Prepare the content parts (image + question)
    const parts: Part[] = [
      {
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG format - adjust if needed
          data: cleanImageData
        }
      },
      { text: question }
    ];

    // Generate response
    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}

// Explain selected text
export async function explainSelectedText(
  selectedText: string,
  pdfContext: string = ""
): Promise<string> {
  try {
    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig: {
        ...generationConfig,
        maxOutputTokens: 4096 // Using a smaller size for explanations
      } 
    });

    // Truncate context if too long
    let processedContext = pdfContext;
    if (pdfContext && pdfContext.length > 15000) {
      processedContext = pdfContext.substring(0, 15000);
    }

    // Create the prompt based on whether we have context
    let prompt = "";
    if (processedContext) {
      prompt = `
        I've selected the following text from a research paper:
        
        "${selectedText}"
        
        Here's some context from the paper:
        
        ${processedContext}
        
        Please explain the selected text in detail. Consider:
        1. What does this text mean in plain language?
        2. How does it relate to the main topics of the paper?
        3. Why is this point significant?
        4. Are there any technical terms that need explanation?
        
        Format your answer as follows:
        
        ## Explanation
        [Your explanation here...]
        
        ## Key Concepts
        - [List key concepts mentioned]
        
        ## Context
        [How this fits into the broader paper]
      `;
    } else {
      prompt = `
        I've selected the following text from a research paper:
        
        "${selectedText}"
        
        Please explain this text in detail. Consider:
        1. What does this text mean in plain language?
        2. What are the key concepts mentioned?
        3. Why might this point be significant?
        4. Are there any technical terms that need explanation?
        
        Format your answer in clear sections.
      `;
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error explaining text with Gemini:", error);
    throw error;
  }
}

// Generate a structured summary of a paper
export async function generateStructuredSummary(
  pdfText: string
): Promise<string> {
  try {
    // Truncate text if too long
    let processedText = pdfText;
    if (pdfText.length > 30000) {
      console.log("Text too long, truncating to 30,000 characters");
      processedText = pdfText.substring(0, 30000);
    }

    // Create the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      safetySettings,
      generationConfig
    });

    // Prompt for structured summary
    const prompt = `
      You're an academic research assistant tasked with creating a structured summary of this research paper.

      Here's the paper content:
      
      ${processedText}
      
      Please generate a comprehensive but concise summary with the following structure:
      
      # Paper Summary
      
      ## 1. Key Takeaways
      [3-5 bullet points of the most important findings/contributions]
      
      ## 2. Research Question
      [The main research question(s) addressed]
      
      ## 3. Methodology
      [Summary of the research approach and methods]
      
      ## 4. Main Findings
      [The key results and their significance]
      
      ## 5. Limitations
      [Any stated limitations of the research]
      
      ## 6. Future Work
      [Suggestions for future research mentioned in the paper]
      
      Make your summary informative but concise, focusing on what would be most useful for someone deciding whether to read the full paper.
    `;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating structured summary:", error);
    throw error;
  }
}
