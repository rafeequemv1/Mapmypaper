import { GoogleGenerativeAI } from "@google/generative-ai";

// Analyze image with gemini pro vision api
export const analyzeImageWithGemini = async (base64Image: string) => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the prompt and image data
    const prompt = "Describe what is shown in this image in detail.";
    const imageData = base64Image.split(',')[1]; // Remove the data:image/jpeg;base64, prefix
    const imageBytes = Buffer.from(imageData, 'base64');

    // Convert image bytes to base64
    const imageBase64 = imageBytes.toString('base64');

    // Create the image content object
    const imageContent = {
      inlineData: {
        mimeType: "image/png",
        data: imageBase64
      }
    };

    // Send the image and prompt to the Gemini Pro Vision model
    const result = await model.generateContent([prompt, imageContent]);
    const response = result.response.text();

    return response;
  } catch (error) {
    console.error('Error in analyzeImageWithGemini:', error);
    throw new Error(`Failed to analyze image with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Analyze file with gemini pro api
export const analyzeFileWithGemini = async (fileContent: string, fileName: string, fileType: string) => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt
    const prompt = `Analyze the contents of this file: ${fileName} (Type: ${fileType}).\n\n${fileContent}\n\nProvide a summary of the key information, insights, and any notable patterns or anomalies.`;

    // Send the prompt to the Gemini Pro model
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response;
  } catch (error) {
    console.error('Error in analyzeFileWithGemini:', error);
    throw new Error(`Failed to analyze file with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generate mind map from text using gemini pro api
export const generateMindMapFromText = async (text: string) => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prepare the prompt
    const prompt = `Create a mind map JSON structure from the following text.
      The mind map should represent the key topics, subtopics, and relationships in the text.
      Use a JSON format that Mind-Elixir library can read.
      The root topic should be the title of the text.
      Here is the text:
      ${text}
      `;

    // Send the prompt to the Gemini Pro model
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the JSON response
    const mindMapData = JSON.parse(response);

    return mindMapData;
  } catch (error) {
    console.error('Error in generateMindMapFromText:', error);
    throw new Error(`Failed to generate mind map with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generate structured summary from PDF
export const generateStructuredSummary = async () => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Get the current PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText') || '';
    
    if (!pdfText.trim()) {
      return {
        Summary: "No PDF text available. Please upload a PDF first.",
        "Key Findings": "N/A",
        Objectives: "N/A",
        Methods: "N/A",
        Results: "N/A",
        Conclusions: "N/A",
        "Key Concepts": "N/A"
      };
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Truncate PDF if necessary to fit token limits (approx 100k chars)
    const truncatedPdf = pdfText.length > 100000 
      ? pdfText.substring(0, 100000) + "... [content truncated due to length]" 
      : pdfText;

    // Prepare the prompt for structured summary
    const prompt = `Create a comprehensive, well-structured summary of the following academic paper or document.
    Format your response as a JSON object with the following sections:
    - Summary: A concise overview of the entire document (a few paragraphs).
    - Key Findings: The most important discoveries or conclusions.
    - Objectives: The main goals or research questions of the document.
    - Methods: The approach, methodology, or techniques used.
    - Results: The outcomes, data, or findings presented.
    - Conclusions: The final takeaways or implications.
    - Key Concepts: Important terms, ideas, or theoretical frameworks introduced.

    When referring to specific information from the document, use the citation format [citation:pageX] where X is the relevant page number.
    Make your summary thorough but focused on the most important aspects of the document.
    
    Here is the document text:
    ${truncatedPdf}`;

    // Send the prompt to the Gemini Pro model
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Try to parse the response as JSON
    try {
      const jsonResponse = JSON.parse(response);
      return jsonResponse;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      
      // If JSON parsing fails, return a simplified structure with the raw text
      return {
        Summary: response,
        "Key Findings": "Error parsing structured response.",
        Objectives: "Error parsing structured response.",
        Methods: "Error parsing structured response.",
        Results: "Error parsing structured response.",
        Conclusions: "Error parsing structured response.",
        "Key Concepts": "Error parsing structured response."
      };
    }
  } catch (error) {
    console.error('Error in generateStructuredSummary:', error);
    throw new Error(`Failed to generate summary with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generate flowchart from PDF content
export const generateFlowchartFromPdf = async () => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Get the current PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText') || '';
    
    if (!pdfText.trim()) {
      return 'flowchart LR\n  A[No PDF Loaded] --> B[Please upload a PDF]\n  B --> C[Then generate a flowchart]';
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Truncate PDF if necessary to fit token limits (approx 80k chars to leave room for output)
    const truncatedPdf = pdfText.length > 80000 
      ? pdfText.substring(0, 80000) + "... [content truncated due to length]" 
      : pdfText;

    // Prepare the prompt for flowchart generation
    const prompt = `Create a mermaid flowchart from this document that represents the main process, methodology, or workflow described in it.
    Use the flowchart LR (left to right) orientation for better readability.
    Keep the flowchart focused on the core process or story - aim for 5-15 nodes maximum.
    Use concise labels and clear relationships.
    Return ONLY the mermaid code without any explanation or markdown formatting.
    
    Here is the document text:
    ${truncatedPdf}`;

    // Send the prompt to the Gemini Pro model
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up the response to ensure it's valid mermaid code
    let flowchartCode = response.replace(/```mermaid|```/g, '').trim();
    
    // Ensure the flowchart starts with 'flowchart LR'
    if (!flowchartCode.startsWith('flowchart LR')) {
      flowchartCode = 'flowchart LR\n' + flowchartCode.replace(/^flowchart (TD|TB)/, '');
    }

    return flowchartCode;
  } catch (error) {
    console.error('Error in generateFlowchartFromPdf:', error);
    throw new Error(`Failed to generate flowchart with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generate mind map from PDF content
export const generateMindmapFromPdf = async () => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Get the current PDF text from session storage
    const pdfText = sessionStorage.getItem('pdfText') || '';
    
    if (!pdfText.trim()) {
      return 'mindmap\n  root((No PDF))\n    Upload a PDF\n      Then generate a mind map';
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Truncate PDF if necessary to fit token limits (approx 80k chars to leave room for output)
    const truncatedPdf = pdfText.length > 80000 
      ? pdfText.substring(0, 80000) + "... [content truncated due to length]" 
      : pdfText;

    // Prepare the prompt for mindmap generation
    const prompt = `Create a mermaid mindmap diagram that represents the key concepts, relationships, and hierarchy in this document.
    The mindmap should have a clear root node and logical branching structure.
    Keep labels short and descriptive, with 3-7 main branches and appropriate sub-branches.
    Return ONLY the mermaid code without any explanation or markdown formatting.
    
    Here is the document text:
    ${truncatedPdf}`;

    // Send the prompt to the Gemini Pro model
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up the response to ensure it's valid mermaid mindmap code
    let mindmapCode = response.replace(/```mermaid|```/g, '').trim();
    
    // Ensure the code starts with 'mindmap'
    if (!mindmapCode.startsWith('mindmap')) {
      mindmapCode = 'mindmap\n' + mindmapCode;
    }

    return mindmapCode;
  } catch (error) {
    console.error('Error in generateMindmapFromPdf:', error);
    throw new Error(`Failed to generate mindmap with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Modified to handle PDFs uploaded directly in chat
export const chatWithGeminiAboutPdf = async (message: string, useAllPdfs = false) => {
  try {
    // Use the provided API key directly
    const apiKey = "AIzaSyAuwIzpzBdk9hJYNSm-hpbA1NKfsja9JOY";
    if (!apiKey) {
      throw new Error('Gemini API Key not found. Please add your key to environment variables.');
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get PDF content based on settings
    let pdfText = '';
    
    if (useAllPdfs) {
      // Get all available PDF texts from session storage
      const allTexts: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('pdfText_')) {
          const text = sessionStorage.getItem(key);
          if (text) {
            allTexts.push(text);
          }
        }
      }
      
      // Combine all texts with clear separators
      if (allTexts.length > 0) {
        pdfText = allTexts.join('\n\n--- NEXT DOCUMENT ---\n\n');
      }
    } else {
      // Just get the currently active PDF text
      pdfText = sessionStorage.getItem('pdfText') || '';
    }

    if (!pdfText.trim()) {
      return "I don't have any document context yet. Please upload a PDF first, or try asking a general question.";
    }

    // Prepare chat history for the conversation
    const chatHistory = [];

    // Truncate PDF if necessary to fit token limits (approx 100k chars)
    const truncatedPdf = pdfText.length > 100000 ? pdfText.substring(0, 100000) + "... [content truncated due to length]" : pdfText;

    // Start the chat with the model, including PDF text in the system prompt
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.6,
      },
    });

    // Create system prompt with PDF context
    const systemPrompt = `You are a helpful research assistant that helps users understand academic papers and other documents. 
Here is the content of the PDF you're discussing:

${truncatedPdf}

When referring to specific parts of the document, cite the source using [citation:pageX] format where X is the relevant page.
Always maintain a helpful, friendly and conversational tone. Be concise but thorough. Use appropriate emojis occasionally.`;

    // Send the combined message to the model
    const result = await chat.sendMessage(`${systemPrompt}\n\nUser question: ${message}`);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Error in chatWithGeminiAboutPdf:', error);
    throw new Error(`Failed to chat with Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
};
