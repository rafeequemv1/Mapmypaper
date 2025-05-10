
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getAllPdfs, getPdfKey } from "@/components/PdfTabs";
import { getAllPdfText } from "@/utils/pdfStorage";

// Initialize the Gemini API with a fixed API key
const apiKey = "AIzaSyAiqTjjCuc3p8TIV8PuWqtPJ-HmgDoVm6A";

// Get the current API key
export const getGeminiApiKey = () => apiKey;

// Create a standard research paper template for fallback - moved outside the function
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

// Process text with Gemini to generate mindmap data
export const generateMindMapFromText = async (pdfText: string): Promise<any> => {
  try {
    // Store the PDF text in sessionStorage for chat functionality
    sessionStorage.setItem('pdfText', pdfText);
    
    // Extract title from PDF for minimal customization
    let paperTitle = "Research Paper";
    const firstLine = pdfText.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 5 && firstLine.length < 200) {
      paperTitle = firstLine;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("Sending PDF text to Gemini API for mind map generation...");
    console.log(`PDF text length: ${pdfText.length} characters`);

    // First, try to get at least a title from the PDF
    try {
      // Create improved prompt for better results with complete sentences
      const prompt = `
      Analyze the following academic paper/document text and extract specific information to create a detailed mind map.

      IMPORTANT: You MUST extract ACTUAL content and specific insights from the document. DO NOT use generic placeholders.

      For the root node, extract the paper's actual title.
      For each section, extract specific content representing what's actually in the paper.
      
      FORMAT REQUIREMENTS:
      1. Each topic MUST be a COMPLETE SENTENCE with subject, verb, and proper punctuation
      2. Use SPECIFIC information extracted from the text (not generic labels)
      3. For each node, include actual findings, methods, or arguments from the paper
      4. Use specific terminology from the paper to ensure accuracy
      5. End each sentence with proper punctuation (period, question mark, etc.)
      
      Format the response as a JSON object with this exact structure:
      ${JSON.stringify(researchPaperTemplate, null, 2)}

      CRITICAL RULES:
      1. Do NOT change the structure of the template
      2. Keep all node IDs and directions as they are
      3. ONLY replace the topic text with SPECIFIC content from the paper as COMPLETE SENTENCES
      4. If you're unsure about a section, use the most relevant content you can find
      5. Make sentences informative but concise (10-15 words maximum)

      Here's the document text to analyze:
      ${pdfText.slice(0, 15000)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the JSON response
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
        const jsonString = jsonMatch ? jsonMatch[1].trim() : text.trim();
        const parsedResponse = JSON.parse(jsonString);
        
        console.log("Successfully parsed mind map data from Gemini response");
        
        // Store the raw template for backup
        sessionStorage.setItem('mindMapTemplate', JSON.stringify(researchPaperTemplate));
        
        // Check if the response has valid structure
        if (parsedResponse && parsedResponse.nodeData && parsedResponse.nodeData.children) {
          console.log("Generated mind map with custom content");
          return parsedResponse;
        } else {
          throw new Error("Invalid mind map structure");
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        throw parseError;
      }
    } catch (error) {
      console.error("Error in primary mind map generation:", error);
      
      // Fallback approach: Try to at least populate the top-level nodes with complete sentences
      try {
        console.log("Attempting fallback mind map generation...");
        
        // Create a simplified template with the extracted title
        const customTemplate = JSON.parse(JSON.stringify(researchPaperTemplate));
        customTemplate.nodeData.topic = paperTitle;
        
        // Attempt to extract key sections from the PDF text as complete sentences
        const sections = extractSectionsFromText(pdfText, true);
        
        // Apply extracted sections to our template
        if (sections.summary) customTemplate.nodeData.children[0].topic = sections.summary;
        if (sections.introduction) customTemplate.nodeData.children[1].topic = sections.introduction;
        if (sections.methodology) customTemplate.nodeData.children[2].topic = sections.methodology;
        if (sections.results) customTemplate.nodeData.children[3].topic = sections.results;
        if (sections.discussion) customTemplate.nodeData.children[4].topic = sections.discussion;
        if (sections.conclusion) customTemplate.nodeData.children[5].topic = sections.conclusion;
        
        console.log("Generated fallback mind map with basic customization");
        return customTemplate;
      } catch (fallbackError) {
        console.error("Fallback mind map generation also failed:", fallbackError);
        
        // Final fallback - use template but at least customize the title
        const basicTemplate = JSON.parse(JSON.stringify(researchPaperTemplate));
        basicTemplate.nodeData.topic = paperTitle;
        console.log("Using basic template with paper title");
        return basicTemplate;
      }
    }
  } catch (error) {
    console.error("Critical error in mind map generation:", error);
    
    // Extract title from PDF and use it in the template
    try {
      const titleMatch = pdfText.match(/^(.+?)(?:\n|$)/);
      const paperTitle = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Research Paper";
      
      const basicTemplate = JSON.parse(JSON.stringify(researchPaperTemplate));
      basicTemplate.nodeData.topic = paperTitle;
      
      return basicTemplate;
    } catch (e) {
      console.error("Error creating basic template:", e);
      return researchPaperTemplate;
    }
  }
};

// Helper function to extract key sections from PDF text
const extractSectionsFromText = (text: string, completeSentences = true): Record<string, string> => {
  const sections: Record<string, string> = {};
  const lowercaseText = text.toLowerCase();
  
  // Try to find common section headings in academic papers
  const findSection = (sectionName: string, keywords: string[]): string | null => {
    for (const keyword of keywords) {
      // Modified regex to capture more text for complete sentences
      const regex = new RegExp(`(${keyword}[\\s:.].*?)(?=\\n\\s*(?:[0-9]+\\.|[I|V|X]+\\.|[A-Z][a-z]+\\s*[:.]))`, 'i');
      const match = lowercaseText.match(regex);
      if (match && match[1]) {
        // Extract a complete sentence if requested
        let phrase = match[1].trim();
        if (completeSentences) {
          // Get more context to form a complete sentence
          const sentenceMatch = phrase.match(/[^.!?]*[.!?]/);
          if (sentenceMatch && sentenceMatch[0]) {
            phrase = sentenceMatch[0].trim();
          } else if (phrase.length > 3 && phrase.length < 150) {
            // If no complete sentence found, ensure it ends with period
            phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
            if (!/[.!?]$/.test(phrase)) {
              phrase += '.';
            }
          }
        } else {
          // Original behavior - just get a short phrase
          phrase = phrase.split(/[.;:]/)[0];
        }
        
        if (phrase.length > 3 && phrase.length < 150) {
          return phrase.charAt(0).toUpperCase() + phrase.slice(1);
        }
      }
    }
    return null;
  };
  
  // Try to extract each section as a complete sentence
  sections.summary = findSection('summary', ['abstract', 'summary', 'overview']) || "This paper summarizes research findings on an important topic.";
  sections.introduction = findSection('introduction', ['introduction', 'background']) || "The introduction provides context for understanding the research problem.";
  sections.methodology = findSection('methodology', ['method', 'methodology', 'approach', 'experimental', 'materials']) || "The methodology describes how the research was conducted with appropriate rigor.";
  sections.results = findSection('results', ['result', 'findings', 'outcomes']) || "Results present the empirical findings from the conducted experiments.";
  sections.discussion = findSection('discussion', ['discussion', 'analysis', 'interpretation']) || "The discussion explores the meaning and implications of the results.";
  sections.conclusion = findSection('conclusion', ['conclusion', 'concluding', 'summary', 'future work']) || "The conclusion summarizes key contributions and suggests future research directions.";
  
  return sections;
};

// Chat with Gemini about PDF content with citation support
export const chatWithGeminiAboutPdf = async (message: string, useAllPdfs = false): Promise<string> => {
  try {
    // Get PDF text based on mode
    let pdfText = "";
    
    if (useAllPdfs) {
      // Get text from all PDFs using the imported function from pdfStorage.ts
      const allPdfTexts = await getAllPdfText();
      // Join all PDF texts with a separator to create a single string
      pdfText = allPdfTexts.join('\n\n--- NEW DOCUMENT ---\n\n');
    } else {
      // Get text from the active PDF
      pdfText = sessionStorage.getItem('pdfText') || "";
    }
    
    if (!pdfText || pdfText.trim() === '') {
      return "I don't have access to any PDF content. Please make sure you've uploaded a PDF first.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Add context about which mode we're using
    const contextPrefix = useAllPdfs 
      ? "You are analyzing MULTIPLE PDFs. When citing sources, include the PDF name if available." 
      : "You are analyzing a SINGLE PDF.";
    
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
    4. When referencing specific parts of the document, include a citation in this format: [citation:pageX] where X is the page number or section identifier.
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

// New function to analyze images with Gemini vision capabilities
export const analyzeImageWithGemini = async (imageData: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage for context
    const pdfText = sessionStorage.getItem('pdfText');
    const pdfContext = pdfText ? pdfText.slice(0, 5000) : "";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process image data to ensure proper format
    // Remove data URL prefix if present (e.g., "data:image/png;base64,\")
    const base64Image = imageData.split(',')[1] || imageData;
    
    // Create the content parts including the image
    // Fixed version that matches the GenerativeAI library's expected types
    const prompt = `
      You are an AI research assistant helping a user understand content from an academic PDF. 
      The user has shared a snapshot from the PDF document. 
      Analyze the image and provide a detailed explanation of what's shown.
      If there are figures, charts, tables, equations, or diagrams, describe them thoroughly.
      If there is text content, summarize the key points and explain any technical concepts.
      Make connections to the broader context of the document if possible.
      
      Here's some context from the document (it may be truncated):
      ${pdfContext}
    `;
    
    // Create properly formatted content parts
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Image
      }
    };
    
    // Generate content with the image - fixed structure
    const result = await model.generateContent([
      prompt,
      imagePart
    ]);
    
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini API vision error:", error);
    return "Sorry, I encountered an error while analyzing the image. Please try again.";
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
    Create a simple, VALID and COLORFUL Mermaid flowchart based on this document text.

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

    COLORFUL REQUIREMENT:
    - For each node, ADD a Mermaid class assignment line at the end as:
        class NODE_ID CLASSNAME
      where CLASSNAME is one of: success, warning, info, neutral, decision, default, danger.
    - Try to use a different class for every connected node so the flowchart looks colorful.
    - Example:
      flowchart TD
        A[Start] --> B{Decision}
        B -->|Yes| C[Process One]
        B -->|No| D[Process Two]
        C --> E[End]
        D --> E
        class A success
        class B decision
        class C info
        class D warning
        class E default

    - Your output should use several classes so the colors are visible in the chart.

    Here's the document text:
    ${pdfText.slice(0, 8000)}

    Generate ONLY valid Mermaid flowchart code WITH the described COLORFUL class lines, nothing else.
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
      fixedLine = fixedLine.replace(/\(([^\)]*)-([^)]*)\)/g, function(match, p1, p2) {
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
      return `mindmap
        root((Error))
          No PDF Content
            Please upload a PDF first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a valid Mermaid mindmap based on this document text. 
    
    IMPORTANT: Use ACTUAL SPECIFIC content from the document, not generic labels.
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'mindmap'
    2. Use proper indentation for hierarchy
    3. Root node must use this exact syntax: root((Paper Title))
    4. First level nodes use text on their own line with proper indentation
    5. You can use these node styles:
       - Regular text node (just text)
       - Text in square brackets [Text]
       - Text in parentheses (Text)
       - Text in double parentheses ((Text))
    6. Max 3 levels of hierarchy
    7. Max 15 nodes total
    8. AVOID special characters that might break syntax
    9. NEVER use class declarations like "class node className"
    
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
    ${pdfText.slice(0, 8000)}
    
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

// Helper function to clean and fix common Mermaid mindmap syntax issues
const cleanMindmapSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `mindmap
      root((Error))
        Empty mindmap
          Please try again`;
  }

  try {
    // Ensure the code starts with mindmap directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("mindmap")) {
      cleaned = "mindmap\n" + cleaned;
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
      
      // Keep mindmap directive
      if (trimmedLine.startsWith('mindmap')) {
        validLines.push(line);
        return;
      }
      
      // Remove semicolons which can cause issues
      let fixedLine = line;
      fixedLine = fixedLine.replace(/;/g, "");
      
      // Remove special characters that might break the syntax
      fixedLine = fixedLine.replace(/[<>]/g, m => m === '<' ? '(' : ')');
      
      // CRITICAL: Remove class declarations that could cause errors
      if (fixedLine.includes("class ")) {
        fixedLine = fixedLine.split("class ")[0].trim();
      }
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning mindmap syntax:", error);
    return `mindmap
      root((Error))
        Syntax Cleaning Failed
          Please try again`;
  }
};

// New function to analyze text-based files with Gemini
export const analyzeFileWithGemini = async (fileContent: string, fileName: string, fileType: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage for context
    const pdfText = sessionStorage.getItem('pdfText');
    const pdfContext = pdfText ? pdfText.slice(0, 3000) : "";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are an AI research assistant helping a user understand a text file in the context of their research paper. 
      
      FILE DETAILS:
      File name: ${fileName}
      File type: ${fileType}
      
      FILE CONTENT (may be truncated):
      ${fileContent.slice(0, 10000)}
      
      PDF CONTEXT (for reference, may be truncated):
      ${pdfContext}
      
      Please analyze this file and provide the following information:
      1. A concise summary of what the file contains
      2. How this file might relate to the research paper (if applicable)
      3. Any technical details that might be relevant (e.g., for code files, what the code does)
      4. Any patterns, trends, or interesting points in the data (if it's a data file)
      
      Format your response with proper markdown, using headings, bullet points, and code blocks where appropriate.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API file analysis error:", error);
    return "Sorry, I encountered an error while analyzing the file. Please try again.";
  }
};
