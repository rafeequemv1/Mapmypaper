import { GoogleGenerativeAI, GenerativeModel, Part } from "@google/generative-ai";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Store the PDF text in sessionStorage for chat functionality
    sessionStorage.setItem('pdfText', pdfText);
    
    // Create a standard research paper template
    const researchPaperTemplate = {
      "nodeData": {
        "id": "root",
        "topic": "Research Paper Title",
        "root": true,
        "children": [
          {
            "id": "summary",
            "topic": "Paper Summary",
            "direction": 0,
            "children": [
              { "id": "summary1", "topic": "Key Points" },
              { "id": "summary2", "topic": "Main Contributions" },
              { "id": "summary3", "topic": "Significance" }
            ]
          },
          {
            "id": "intro",
            "topic": "Introduction",
            "direction": 0,
            "children": [
              { "id": "intro1", "topic": "Background / Context" },
              { "id": "intro2", "topic": "Motivation / Problem Statement" },
              { "id": "intro3", "topic": "Research Gap" },
              { "id": "intro4", "topic": "Objective / Hypothesis" }
            ]
          },
          {
            "id": "method",
            "topic": "Methodology",
            "direction": 0,
            "children": [
              { "id": "method1", "topic": "Experimental Setup / Data Collection" },
              { "id": "method2", "topic": "Models / Theories / Frameworks" },
              { "id": "method3", "topic": "Procedures / Algorithms" },
              { "id": "method4", "topic": "Variables / Parameters" }
            ]
          },
          {
            "id": "results",
            "topic": "Results",
            "direction": 1,
            "children": [
              { "id": "results1", "topic": "Key Findings" },
              { "id": "results2", "topic": "Figures / Tables / Visualizations" },
              { "id": "results3", "topic": "Statistical Analysis" },
              { "id": "results4", "topic": "Observations" }
            ]
          },
          {
            "id": "discuss",
            "topic": "Discussion",
            "direction": 1,
            "children": [
              { "id": "discuss1", "topic": "Interpretation of Results" },
              { "id": "discuss2", "topic": "Comparison with Previous Work" },
              { "id": "discuss3", "topic": "Implications" },
              { "id": "discuss4", "topic": "Limitations" }
            ]
          },
          {
            "id": "concl",
            "topic": "Conclusion",
            "direction": 1,
            "children": [
              { "id": "concl1", "topic": "Summary of Contributions" },
              { "id": "concl2", "topic": "Future Work" },
              { "id": "concl3", "topic": "Final Remarks" }
            ]
          },
          {
            "id": "refs",
            "topic": "References",
            "direction": 0,
            "children": [
              { "id": "refs1", "topic": "Key Papers Cited" },
              { "id": "refs2", "topic": "Datasets / Tools" }
            ]
          },
          {
            "id": "supp",
            "topic": "Supplementary",
            "direction": 0,
            "children": [
              { "id": "supp1", "topic": "Additional Experiments" },
              { "id": "supp2", "topic": "Appendices" },
              { "id": "supp3", "topic": "Code / Data Availability" }
            ]
          }
        ]
      }
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze the following academic paper/document text and extract specific information to create a detailed mind map.
    
    For each node, extract a SPECIFIC insight or finding from the paper, NOT just generic placeholders.
    
    For the root node, use the paper's actual title.
    For each section (Introduction, Methodology, Results, etc.), include specific content from the paper.
    For child nodes, extract actual data points, findings, arguments, or methodologies mentioned in the paper.
    
    IMPORTANT:
    1. DO NOT use generic placeholders like "Key Findings" - instead, write actual findings like "40% reduction in error rate"
    2. Extract SPECIFIC phrases from the text - use the actual content from the paper
    3. Include actual numbers, percentages, and specific terminology used in the paper
    4. For Results, include actual experimental outcomes mentioned in the paper
    5. For Methodology, include specific techniques, equipment or approaches used
    6. If certain information isn't available, make a reasonable inference based on the text
    
    Format the response as a JSON object with the following structure:
    ${JSON.stringify(researchPaperTemplate, null, 2)}

    IMPORTANT REQUIREMENTS:
    1. Do NOT modify the structure of the template - keep ALL nodes.
    2. Replace the generic topic text with SPECIFIC content from the paper.
    3. Keep all node IDs and directions as they are in the template.
    4. Keep each topic concise (under 10-15 words) but SPECIFIC to the paper content.
    5. For the Summary section, include actual key findings from the paper.
    6. Only include the JSON in your response, nothing else.
    
    Here's the document text to analyze:
    ${pdfText.slice(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      // Find and extract JSON if it's surrounded by markdown code blocks or other text
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
      const parsedResponse = JSON.parse(jsonString);
      
      // Store the raw template for backup
      sessionStorage.setItem('mindMapTemplate', JSON.stringify(researchPaperTemplate));
      
      // Debug the response
      console.log("Parsed mindmap data:", JSON.stringify(parsedResponse.nodeData, null, 2));
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.log("Using template instead due to parsing error");
      
      // If parsing fails, use the template with the paper title extracted, if possible
      try {
        const titleMatch = pdfText.match(/^(.+?)(?:\n|$)/);
        if (titleMatch && titleMatch[1]) {
          researchPaperTemplate.nodeData.topic = titleMatch[1].trim();
        }
      } catch (e) {
        console.error("Error extracting title:", e);
      }
      
      return researchPaperTemplate;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// Chat with Gemini about PDF content with citation support
export const chatWithGeminiAboutPdf = async (message: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return "I don't have access to the PDF content. Please make sure you've uploaded a PDF first.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Conversational, concise system prompt
    const prompt = `
    You are a conversational research assistant helping with a PDF document. 
    The user has asked: "${message}"
    
    Here's the content from their research paper (it may be truncated):
    ${pdfText.slice(0, 15000)}
    
    ## Communication Guidelines:
    - Be conversational and concise - users want short answers unless they ask for details
    - Sound like a helpful colleague, not a formal summarizer
    - Keep responses brief (3-5 sentences) unless detailed explanation is requested
    - Use a friendly, casual tone while maintaining academic accuracy
    - Only structure responses with headings when answering complex questions
    - Use emojis occasionally to keep the conversation engaging 👍
    
    ## Response Format:
    - Default to short, direct answers addressing exactly what was asked
    - Use bullet points for clarity when listing multiple items
    - Include citations when referring to specific content: [citation:pageX]
    - Mention figure/table numbers naturally: "Figure 3 shows..." or "In Table 2..."
    
    ## When responding:
    - Avoid summarizing the entire paper unless specifically asked
    - Focus precisely on the user's question
    - If you don't know, say so briefly
    - End with a short follow-up question only when appropriate
    
    Remember: Be concise, friendly, and focus on directly answering what was asked.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API chat error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again.";
  }
};

// Enhanced function to analyze images with Gemini vision capabilities
export const analyzeImageWithGemini = async (imageData: string, pdfText?: string): Promise<string> => {
  try {
    console.log("Starting to analyze image with Gemini, image data length:", imageData?.length);
    
    if (!imageData || imageData.length < 100 || !imageData.startsWith('data:image/')) {
      console.error("Invalid image data provided to analyzeImageWithGemini:", {
        present: !!imageData,
        length: imageData?.length || 0,
        validFormat: imageData?.startsWith('data:image/') || false
      });
      return "I couldn't analyze this image. The image data appears to be invalid or missing. Please try selecting an area again.";
    }
    
    // Use context from stored PDF text if not provided
    const pdfContext = pdfText || (sessionStorage.getItem('pdfText') 
      ? sessionStorage.getItem('pdfText')!.slice(0, 5000) 
      : "");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process image data to ensure proper format
    let base64Image = imageData;
    
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    if (base64Image.includes('base64,')) {
      base64Image = imageData.split(',')[1] || imageData;
      console.log("Extracted base64 data without prefix, length:", base64Image.length);
    }
    
    if (base64Image.length < 100) {
      console.error("Base64 image data is too short after processing:", base64Image.length);
      return "The captured image data appears to be corrupted or empty. Please try selecting an area again.";
    }
    
    console.log("Preparing to send image to Gemini API");
    
    const promptText = `
    You are a research-savvy assistant analyzing a section of a scientific PDF that the user has selected.
      
    ## Communication Style Guidelines:
    - Communicate like an experienced PhD student or postdoc mentoring a junior researcher
    - Be friendly, professional, and slightly informal when appropriate
    - Show genuine interest in helping the user understand what they're looking at
    
    ## Response Structure:
    - Use headings and subheadings to organize your response
    - Use bullet points and numbered lists for clarity when appropriate
    - Include citations to specific elements you identify in the image
    
    ## Content Analysis:
    Analyze this image in detail and provide a comprehensive explanation. If it contains:
    - Text: Summarize the key points and explain any technical concepts
    - Figures/charts: Describe their purpose, axes, trends, and significance
    - Tables: Explain what data is presented and its importance
    - Diagrams: Break down what they illustrate and their components
    - Equations: Explain their meaning and variables
    
    End your response with a light follow-up question about the analyzed content.
    
    Here's some context from the document (it may be truncated):
    ${pdfContext}
    `;
    
    console.log("Creating content parts for Gemini API request");
    
    // Create the properly typed content parts array
    const contentParts: Part[] = [];
    
    // Add the text prompt
    contentParts.push({
      text: promptText
    });
    
    // Add the image data
    contentParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    });
    
    console.log("Sending request to Gemini API");
    
    // Generate content with the image
    const result = await model.generateContent(contentParts);
    console.log("Received response from Gemini API");
    
    const response = await result.response;
    const generatedText = response.text();
    
    console.log("Processed Gemini response:", {
      length: generatedText.length,
      preview: generatedText.substring(0, 100) + "..."
    });
    
    return generatedText;
  } catch (error) {
    console.error("Gemini API vision error:", error);
    return "Sorry, I encountered an error while analyzing the image: " + (error as Error).message + ". Please try again with a different selection.";
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
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
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

// New function to generate flowchart from PDF content
export const generateFlowchartFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `flowchart TD
        A[Error] --> B[No PDF Content]
        B --> C[Please upload a PDF first]`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a simple, valid Mermaid flowchart based on this document text.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'flowchart TD'
    2. Nodes MUST have this format: A[Text] or A(Text) or A{Text} - no exceptions
    3. Node IDs MUST be simple alphanumeric: A, B, C1, process1 (NO special chars or hyphens)
    4. Connections MUST use EXACTLY TWO dashes: A --> B (not A->B or A---->B)
    5. Each line should define ONE connection or ONE node
    6. Max 12 nodes total
    7. For labels on arrows: A -->|Label text| B (use single pipes)
    8. Never use semicolons (;) in node text or connections
    9. EXTREMELY IMPORTANT: Never use hyphens (-) in node text. Replace ALL hyphens with spaces or underscores.
    10. IMPORTANT: Date ranges like 1871-2020 must be written as 1871_2020 in node text.
    11. IMPORTANT: Simple node text is best - keep it short, avoid special characters
    
    EXAMPLE CORRECT SYNTAX:
    flowchart TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Process One]
      B -->|No| D[Process Two]
      C --> E[End]
      D --> E
    
    Here's the document text:
    ${pdfText.slice(0, 8000)}
    
    Generate ONLY valid Mermaid flowchart code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanMermaidSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart TD
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]`;
  }
};

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `flowchart TD
      A[Error] --> B[Empty flowchart]
      B --> C[Please try again]`;
  }

  try {
    // Ensure the code starts with flowchart directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart TD\n" + cleaned;
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n');
    const validLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and keep comments
      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        validLines.push(line);
        return;
      }
      
      // Keep flowchart directive
      if (trimmedLine.startsWith('flowchart') || 
          trimmedLine.startsWith('subgraph') || 
          trimmedLine === 'end') {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax: ensure exactly two dashes
      let fixedLine = line;
      
      // Replace arrows with more or fewer than 2 dashes
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*([A-Za-z0-9_]+)/g, "$1 --> $2");
      
      // Fix arrows with labels too
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*-+>\s*\|([^|]*)\|\s*([A-Za-z0-9_]+)/g, "$1 -->|$2| $3");
      
      // Fix node IDs with hyphens by replacing with underscores
      fixedLine = fixedLine.replace(/\b([A-Za-z0-9]+)-([A-Za-z0-9]+)\b(?!\]|\)|\})/g, "$1_$2");
      
      // Fix date ranges in node text by replacing hyphens with underscores
      // Look for patterns like [text (1871-2020) text] and replace with [text (1871_2020) text]
      fixedLine = fixedLine.replace(/\[([^\]]*?)(\d{4})-(\d{4})([^\]]*?)\]/g, '[$1$2_$3$4]');
      fixedLine = fixedLine.replace(/\(([^\)]*)(\d{4})-(\d{4})([^\)]*)\)/g, '($1$2_$3$4)');
      fixedLine = fixedLine.replace(/\{([^\}]*)(\d{4})-(\d{4})([^\}]*)\}/g, '{$1$2_$3$4}');
      
      // Replace all remaining hyphens inside node text with spaces or underscores
      // Handle square brackets []
      fixedLine = fixedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle parentheses ()
      fixedLine = fixedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle curly braces {}
      fixedLine = fixedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
      
      // Fix nodes without brackets by adding them
      const nodeDefinitionRegex = /^([A-Za-z0-9_]+)\s+\[([^\]]+)\]/;
      const nodeWithoutBrackets = /^([A-Za-z0-9_]+)(\s+)(?!\[|\(|\{)(.*?)(\s*-->|\s*$)/;
      
      if (nodeWithoutBrackets.test(fixedLine)) {
        fixedLine = fixedLine.replace(nodeWithoutBrackets, "$1$2[$3]$4");
      }
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    // Validate: ensure there's at least one connection (arrow)
    const hasConnections = validLines.some(line => line.includes('-->'));
    
    if (!hasConnections) {
      console.warn("No connections found in flowchart, adding default connection");
      validLines.push("A[Start] --> B[End]");
    }
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning Mermaid syntax:", error);
    return `flowchart TD
      A[Error] --> B[Syntax Cleaning Failed]
      B --> C[Please try again]`;
  }
};

// New function to generate sequence diagram from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `sequenceDiagram
        participant Error
        participant User
        
        Error->>User: No PDF Content
        User->>Error: Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a valid Mermaid sequence diagram based on this research document text. 
    The sequence diagram should visualize the methodology, experimental procedures, or workflow described in the document.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'sequenceDiagram'
    2. Participants defined with 'participant Name'
    3. Messages between participants use: ParticipantA->>ParticipantB: Message text 
    4. For activation/deactivation use: activate/deactivate ParticipantName
    5. For notes: Note right/left of ParticipantName: Note text
    6. Keep it simple with max 6-8 participants
    7. Focus on the key steps in the research methodology or experimental process
    8. Don't use any special characters that might break the syntax
    
    EXAMPLE CORRECT SYNTAX:
    sequenceDiagram
      participant Researcher
      participant Sample
      participant Instrument
      
      Researcher->>Sample: Prepare
      activate Sample
      Sample->>Instrument: Analyze
      Instrument->>Researcher: Return results
      deactivate Sample
      Note right of Researcher: Analyze data
    
    Here's the document text:
    ${pdfText.slice(0, 8000)}
    
    Generate ONLY valid Mermaid sequence diagram code, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanSequenceDiagramSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Failed to generate diagram
      System->>Error: Please try again`;
  }
};

// Helper function to clean and fix common sequence diagram syntax issues
const cleanSequenceDiagramSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Empty diagram
      System->>Error: Please try again`;
  }

  try {
    // Ensure the code starts with sequenceDiagram directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("sequenceDiagram")) {
      cleaned = "sequenceDiagram\n" + cleaned;
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n');
    const validLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and keep comments
      if (trimmedLine === '' || trimmedLine.startsWith('%')) {
        validLines.push(line);
        return;
      }
      
      // Keep sequenceDiagram directive
      if (trimmedLine.startsWith('sequenceDiagram')) {
        validLines.push(line);
        return;
      }
      
      // Fix arrow syntax if needed
      let fixedLine = line;
      
      // Fix arrows with two dashes only
      fixedLine = fixedLine.replace(/([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)/g, "$1->>$2");
      
      // Remove semicolons which can cause issues
      fixedLine = fixedLine.replace(/;/g, "");
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning sequence diagram syntax:", error);
    return `sequenceDiagram
      participant Error
      participant System
      
      Error->>System: Syntax Cleaning Failed
      System->>Error: Please try again`;
  }
};

// New function to generate mindmap from PDF content
export const generateMindmapFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      console.error("No PDF content available in sessionStorage");
      return `mindmap
  root((Error))
    No PDF Content
      Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Generating mindmap from PDF text, length:", pdfText.length);
    
    const prompt = `
    Create a valid Mermaid mindmap based on this document text. 
    
    IMPORTANT: 
    1. Use ACTUAL SPECIFIC content from the document, not generic labels.
    2. DO NOT use any styling or class declarations as they are not supported in mindmaps.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'mindmap'
    2. Use proper indentation for hierarchy (2 spaces per level)
    3. Root node must use this exact syntax: root((Paper Title))
    4. First level nodes use text on their own line with proper indentation
    5. You can use these node styles:
       - Regular text node (just text)
       - Text in square brackets [text]
       - Text in parentheses (text)
       - Text in double parentheses ((text))
    6. Max 3 levels of hierarchy
    7. Max 15 nodes total
    8. AVOID special characters that might break syntax
    9. DO NOT USE class declarations or styling with :::classname as they are NOT SUPPORTED in mindmaps
    10. DO NOT ADD ANY class definitions with classDef
    
    EXAMPLE CORRECT SYNTAX:
    mindmap
      root((Research on Machine Learning))
        Introduction
          Background on neural networks
          Problem of overfitting data
        Methodology
          LSTM architecture used
          Training on 50,000 examples
        Results
          93% accuracy achieved
          Compared to 85% baseline
    
    Here's the document text:
    ${pdfText.slice(0, 10000)}
    
    Generate ONLY valid Mermaid mindmap code with SPECIFIC content from the document, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const mermaidCode = text
      .replace(/```mermaid\s?/g, "")
      .replace(/```\s?/g, "")
      .trim();
    
    return cleanMindmapSyntax(mermaidCode);
  } catch (error) {
    console.error("Gemini API mindmap generation error:", error);
    return `mindmap
  root((Error))
    Failed to generate mindmap
      Please try again`;
  }
};

// Helper function to clean mindmap syntax
const cleanMindmapSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `mindmap
  root((Error))
    No Mindmap Generated
      Please try again`;
  }

  try {
    // Ensure the code starts with mindmap directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("mindmap")) {
      cleaned = "mindmap\n" + cleaned;
    }
    
    // Process line by line to remove any class styling
    const lines = cleaned.split('\n');
    const cleanedLines = lines.map(line => {
      // Remove any class styling (:::classname)
      return line.replace(/:::[\w-]+/g, '');
    }).filter(line => !line.trim().startsWith('classDef'));
    
    return cleanedLines.join('\n').trim();
  } catch (error) {
