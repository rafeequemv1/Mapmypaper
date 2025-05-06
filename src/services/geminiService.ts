import { GoogleGenerativeAI } from "@google/generative-ai";

// Analyze image with gemini pro vision api
export const analyzeImageWithGemini = async (base64Image: string) => {
  try {
    // Access the Gemini Pro API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
      mimeType: "image/png",
      data: imageBase64
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
    // Access the Gemini Pro API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
    // Access the Gemini Pro API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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

// Modified to handle PDFs uploaded directly in chat
export const chatWithGeminiAboutPdf = async (message: string, useAllPdfs = false) => {
  try {
    // Access the Gemini Pro API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
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
