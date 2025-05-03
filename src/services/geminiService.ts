
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

let geminiApi: GoogleGenerativeAI | null = null;

function getGeminiApi() {
  if (geminiApi) return geminiApi;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "AIzaSyByH5uD5R_JsskvGu_sVZchnza4kFR5pnM") {
    console.error("⚠️ Invalid Gemini API Key. Please add your API key to .env file.");
    throw new Error("Invalid Gemini API Key. Please add your API key to .env file.");
  }
  
  geminiApi = new GoogleGenerativeAI(apiKey);
  return geminiApi;
}

function getGeminiGenerationConfig() {
  return {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  };
}

// Now let's improve the error handling in our API functions

export async function generateMindMapFromText(text: string): Promise<any> {
  try {
    console.log("Generating mind map from text...");
    
    // Trim very long texts to avoid API limits
    const trimmedText = text.length > 100000 ? text.substring(0, 100000) + "..." : text;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Create a mind map structure from the following academic paper or document. 
    Format the output as JSON matching this exact structure:
    
    {
      "root": {
        "topic": "Main Title of the Document",
        "children": [
          {
            "topic": "Major Section/Topic 1",
            "children": [
              {
                "topic": "Sub-point 1.1",
                "children": []
              },
              {
                "topic": "Sub-point 1.2",
                "children": []
              }
            ]
          },
          {
            "topic": "Major Section/Topic 2",
            "children": []
          }
        ]
      }
    }
    
    Capture the document's hierarchical structure with the main title as the root node.
    Create 4-8 main branches for major sections/topics.
    Add 2-4 sub-branches under each main branch for key points.
    Add 0-3 sub-sub-branches where needed for deeper details.
    Use clear, concise language for node text (5-10 words max per node).
    Ensure the JSON is valid and properly nested.
    
    Here's the document text to analyze:
    
    ${trimmedText}
    
    Return ONLY the valid JSON object with no additional text.`;
    
    console.log("Sending prompt to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("Received response from Gemini API");
    
    // Extract just the JSON part from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the API response");
    }
    
    let jsonText = jsonMatch[0];
    try {
      // Parse and validate the JSON
      const parsedJson = JSON.parse(jsonText);
      console.log("Successfully parsed mind map JSON");
      return parsedJson;
    } catch (jsonError) {
      console.error("Error parsing JSON from API response:", jsonError);
      throw new Error("Failed to parse the mind map JSON structure");
    }
  } catch (error) {
    console.error("Error in generateMindMapFromText:", error);
    throw error;
  }
}

export async function chatWithGeminiAboutPdf(prompt: string): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const config = getGeminiGenerationConfig();
    
    console.log("Sending chat prompt to Gemini API:", prompt.substring(0, 100) + "...");
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: config,
    });
    
    const response = await result.response;
    const text = response.text();
    
    console.log("Received chat response from Gemini API");
    return text;
  } catch (error) {
    console.error("Error in chatWithGeminiAboutPdf:", error);
    throw error;
  }
}

export async function analyzeImageWithGemini(imageBase64: string): Promise<string> {
  try {
    // Strip the data URL prefix if present
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
    
    console.log("Sending image to Gemini Vision API...");
    
    // Create image part from base64 data
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Assume JPEG, but could be dynamic
        },
      },
    ];
    
    // Combine text prompt with image
    const prompt = "Analyze this image from an academic document. Describe what you see in detail, explaining any charts, graphs, figures, diagrams, tables, or text visible. If it contains data visualization, interpret the findings.";
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    console.log("Received image analysis from Gemini API");
    return text;
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    throw error;
  }
}

export async function explainSelectedText(text: string): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const config = getGeminiGenerationConfig();
    
    const prompt = `
      The following is selected text from a research paper or academic document. 
      Please explain it clearly, using academically appropriate language.
      Break down complex concepts, define specialized terms, and highlight the key points.
      If appropriate, mention how this passage connects to broader academic context.
      
      Selected Text:
      "${text}"
    `;
    
    console.log("Sending explanation prompt to Gemini API");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: config,
    });
    
    const response = await result.response;
    
    console.log("Received explanation from Gemini API");
    return response.text();
  } catch (error) {
    console.error("Error in explainSelectedText:", error);
    throw error;
  }
}

// Add the missing functions needed by SummaryModal and MermaidModal
export async function generateStructuredSummary(pdfText: string): Promise<any> {
  try {
    console.log("Generating structured summary...");
    
    // Trim very long texts to avoid API limits
    const trimmedText = pdfText.length > 100000 ? pdfText.substring(0, 100000) + "..." : pdfText;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Create a structured summary of the following academic document or research paper.
    Analyze the content and return a JSON object with the following structure:

    {
      "Summary": "Brief overall summary of the document in 3-5 sentences",
      "Key Findings": "List the main findings or conclusions",
      "Methods": "Brief description of the methodology used",
      "Significance": "Explain the importance of this research",
      "Limitations": "Note any limitations mentioned in the document"
    }

    If the document is not a research paper, adapt the structure to fit the document type.
    For business documents, include "Business Context" and "Financial Implications" instead of "Methods".
    For legal documents, include "Legal Framework" and "Parties & Obligations".
    For creative works, include "Themes" and "Characters/Elements".
    Always include the key points in bullet form where appropriate.

    Here's the document to analyze:
    
    ${trimmedText}

    Return ONLY a valid JSON object with the appropriate structure.`;
    
    console.log("Sending summary prompt to Gemini API...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: getGeminiGenerationConfig(),
    });
    
    const response = await result.response;
    const responseText = response.text();
    
    // Extract just the JSON part from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { Summary: responseText }; // Return the raw text if JSON parsing fails
    }
    
    try {
      const parsedJson = JSON.parse(jsonMatch[0]);
      return parsedJson;
    } catch (jsonError) {
      console.error("Error parsing JSON from API response:", jsonError);
      return { Summary: responseText }; // Return the raw text if JSON parsing fails
    }
  } catch (error) {
    console.error("Error in generateStructuredSummary:", error);
    throw error;
  }
}

export async function generateFlowchartFromText(pdfText: string): Promise<string> {
  try {
    console.log("Generating flowchart from text...");
    
    // Trim very long texts to avoid API limits
    const trimmedText = pdfText.length > 100000 ? pdfText.substring(0, 100000) + "..." : pdfText;
    
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `Create a Mermaid.js flowchart diagram that represents the structure and flow of the following document.
    Focus on the main sections, processes, or arguments and their relationships.
    
    Use the 'graph TD' (top-down) or 'graph LR' (left-right) syntax, whichever best represents the document's structure.
    Use clear, concise labels for nodes (no more than 5-7 words each).
    Include 5-10 main nodes with appropriate connections.
    Add descriptive relationship labels between nodes when helpful.
    
    Here's the document text to analyze:
    
    ${trimmedText}
    
    Return ONLY the valid Mermaid.js flowchart syntax, nothing else.`;
    
    console.log("Sending flowchart prompt to Gemini API...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: getGeminiGenerationConfig(),
    });
    
    const response = await result.response;
    const flowchartText = response.text();
    
    // Basic validation - ensure it contains graph TD or graph LR
    if (!flowchartText.includes('graph TD') && !flowchartText.includes('graph LR')) {
      console.warn("Generated flowchart may not be valid Mermaid syntax");
    }
    
    return flowchartText;
  } catch (error) {
    console.error("Error in generateFlowchartFromText:", error);
    throw error;
  }
}
