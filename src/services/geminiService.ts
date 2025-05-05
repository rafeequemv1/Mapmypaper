import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getAllPdfs, getPdfKey } from "@/components/PdfTabs";
import { getAllPdfText } from "@/utils/pdfStorage";

// Replace process.env with import.meta.env for Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

async function getGeminiApiKey(): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please set the VITE_GEMINI_API_KEY environment variable.");
  }
  return apiKey;
}

// Generate mind map from text
export const generateMindMapFromText = async (text: string): Promise<string> => {
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Given the following text, create a mind map in JSON format.
      The mind map should have a central topic and related subtopics.
      Each subtopic can have its own subtopics, creating a hierarchical structure.
      The JSON format should be as follows:
      {
        "text": "Central Topic",
        "children": [
          {
            "text": "Subtopic 1",
            "children": [
              {
                "text": "Sub-subtopic 1"
              },
              {
                "text": "Sub-subtopic 2"
              }
            ]
          },
          {
            "text": "Subtopic 2"
          }
        ]
      }
      Ensure that the JSON is valid and can be parsed without errors.
      Text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

// Chat with Gemini about PDF content with citation support
export const chatWithGeminiAboutPdf = async (message: string, useAllPdfs = false): Promise<string> => {
  try {
    // Get PDF text based on mode
    let pdfText = "";
    
    if (useAllPdfs) {
      // Get text from all PDFs using the imported function
      pdfText = await getAllPdfText();
      
      // Check if we actually have PDF content
      if (!pdfText || pdfText.trim() === '') {
        return "I don't have access to any PDF content. Please make sure you've uploaded a PDF first.";
      }
    } else {
      // Get text from the active PDF
      pdfText = sessionStorage.getItem('pdfText') || "";
      
      // Check if we have PDF content
      if (!pdfText || pdfText.trim() === '') {
        return "I don't have access to any PDF content. Please make sure you've uploaded a PDF first.";
      }
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add context about which mode we're using
    const contextPrefix = useAllPdfs 
      ? "You are analyzing MULTIPLE PDFs. When citing sources, include the PDF name if available in your citations using format [citation:PDFname:pageX] where PDFname is the name of the PDF and X is the page number." 
      : "You are analyzing a SINGLE PDF. Use format [citation:pageX] where X is the page number for citations.";
    
    // Use a history array to maintain context
    const prompt = `
    ${contextPrefix}
    You are an AI research assistant chatting with a user about a PDF document. 
    The user has the following question or request: "${message}"
    
    Here's an excerpt from the document they're referring to (it may be truncated):
    ${pdfText.slice(0, 15000)}
    
    Provide a helpful, detailed, and accurate response based solely on the document content.
    
    IMPORTANT FORMATTING GUIDELINES:
    1. Use proper markdown formatting with clear headings (# for main headings, ## for subheadings).
    2. Format your response with **bold text** for emphasis and *italics* for technical terms.
    3. Use bullet points (- or *) and numbered lists (1., 2., etc.) for better organization.
    4. When referencing specific parts of the document, include a citation in the format specified above.
    5. For multi-paragraph responses, use proper paragraph breaks.
    6. For important quotes or excerpts, use blockquotes (> text).
    7. Structure your response with a clear hierarchy: Start with a brief overview, then provide detailed information.
    
    If you can't answer based on the provided text, be honest about your limitations.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};

// Analyze image with Gemini Vision
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = "Describe the image in detail. Identify objects, people, and any text present. Provide a comprehensive analysis of the visual content.";

    const imageParts = [
      {
        inlineData: {
          data: imageData.split(",")[1],
          mimeType: "image/png"
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API image analysis error:", error);
    return "Sorry, I encountered an error while analyzing the image. Please try again.";
  }
};

// Analyze file with Gemini
export const analyzeFileWithGemini = async (fileContent: string, fileName: string, fileType: string): Promise<string> => {
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the content of the following file:
      Filename: ${fileName}
      File Type: ${fileType}
      Content:
      ${fileContent}

      Provide a detailed analysis, summarizing key information, identifying important patterns or trends, and offering insights based on the file's content.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API file analysis error:", error);
    return "Sorry, I encountered an error while analyzing the file. Please try again.";
  }
};

// Enhanced function to generate structured summaries from PDF content
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      throw new Error("No PDF content available. Please upload a PDF first.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    You are a scientific summarization assistant. Given the text of a research paper (abstract, full paper, or detailed notes), 
    generate a structured, concise, and clear summary with the following sections. Keep the writing professional and suited 
    for an academic audience who wants a snapshot of the study without reading the full paper.

    Format the output as a JSON object with these section names as keys and the content as values:
    {
      "Summary": "1-2 sentence high-level summary of the entire study: what was studied, how it was studied, and the key finding.",
      
      "Key Findings": "List the main statistical or scientific results clearly, point-wise. Highlight effect sizes, odds ratios, correlations, p-values, or any key quantitative result mentioned in the paper.",
      
      "Objectives": "State the research question(s) or aim(s) of the paper, mentioning the gap in the literature or problem the study tries to address.",
      
      "Methods": "Briefly describe the study design (e.g., cohort study, case-control, simulation, modeling), data collection methods (e.g., surveys, experiments, datasets used), and analysis approach (e.g., regression models, machine learning, statistical tests).",
      
      "Results": "Summarize the main results in 3-5 sentences, focusing on how the data answered the objectives. Include any noteworthy statistics, trends, or patterns.",
      
      "Conclusions": "Summarize the implications of the study, what it contributes to the field, and any potential practical applications.",
      
      "Key Concepts": "List 8-12 important keywords and concepts from the paper for context and indexing."
    }
    
    IMPORTANT:
    - Use bullet points (format as '- Point text') for Key Findings and Key Concepts.
    - Keep each section concise and focused on the most important information.
    - If the document doesn't contain information for a specific section, provide a brief note explaining this.
    - Format the output as proper JSON, not markdown or anything else.
    
    Document text:
    ${pdfText.slice(0, 15000)}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\\s\\S]*?)```/) || text.match(/({[\\s\\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini summary response as JSON:", parseError);
      throw new Error("Failed to generate summary. The AI response format was invalid.");
    }
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    throw error;
  }
};
