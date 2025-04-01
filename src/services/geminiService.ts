import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

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
    Analyze the following academic paper/document text and extract information to fill in this research paper mind map structure.
    Do not change the structure, only fill in the content based on the document.
    
    For each node, provide a clear, complete sentence or short phrase based on the paper's content.
    If information for a certain node isn't available in the document, keep the default label.
    
    For the root node, use the paper's actual title.
    Pay special attention to the Summary section which should provide a concise overview of the entire paper.
    
    Format the response as a JSON object with the following structure EXACTLY AS PROVIDED below:
    ${JSON.stringify(researchPaperTemplate, null, 2)}

    IMPORTANT REQUIREMENTS:
    1. Do NOT modify the structure of the template - keep ALL nodes.
    2. Replace only the topic text with relevant content from the paper.
    3. Keep all node IDs and directions as they are in the template.
    4. For each topic, provide concise but complete information (preferably under 10 words).
    5. For the Summary section, provide a meaningful overview with complete sentences for each child node.
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
    
    // Use a history array to maintain context
    const prompt = `
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
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
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
      return `flowchart LR
        A[No PDF content was found] --> B[Please upload a PDF document first]
        B --> C[The flowchart will be generated based on your document content]`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a detailed, complex Mermaid flowchart based on this document text.
    
    CRITICAL REQUIREMENTS:
    1. Start with 'flowchart LR' (left to right layout)
    2. Use COMPLETE SENTENCES instead of keywords in node text
    3. Make sure nodes have detailed, meaningful text (at least 5-7 words each)
    4. Create at least 12-15 nodes with connections to make it comprehensive
    5. Use detailed connections with labels that explain relationships
    6. Node IDs MUST be simple alphanumeric: A, B, C1, process1 (NO special chars or hyphens)
    7. Use different node shapes for conceptual hierarchy:
       - Main concepts: A[Complete sentence about main concept]
       - Support facts: B(Complete sentence about supporting fact)
       - Examples/Evidence: C{Complete sentence with example}
    
    MERMAID SYNTAX RULES:
    1. Nodes MUST have this format: A[Full sentence] or A(Full sentence) or A{Full sentence}
    2. Connections MUST use EXACTLY TWO dashes: A --> B
    3. Create DETAILED connections with labels: A -->|Causes| B or A -->|Leads to| C
    4. Never use hyphens (-) in node text. Replace hyphens with spaces.
    
    EXAMPLE OF GOOD NODE CONTENT:
    A[The document describes a novel approach to machine learning]
    B(The researchers conducted experiments across multiple datasets)
    C{The experimental results showed improved accuracy by 15 percent}
    
    Here's the document text:
    ${pdfText.slice(0, 10000)}
    
    Generate ONLY valid Mermaid flowchart code with complete sentences for all nodes, nothing else.
    Make sure the diagram contains the main points and findings from the document.
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
    return `flowchart LR
      A[An error occurred while generating the flowchart] -->|Please try again| B[The system encountered an issue processing your PDF]
      B -->|Suggestion| C[Try uploading a different PDF document or reload the page]
      
      %% Node styling
      classDef error fill:#ffcccc,stroke:#b30000,stroke-width:2px,rx:15px,ry:15px
      
      %% Apply styling
      class A,B,C error`;
  }
};

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `flowchart LR
      A[Error occurred while processing your document] --> B[Empty flowchart was generated]
      B --> C[Please try uploading your PDF again]`;
  }

  try {
    // Ensure the code starts with flowchart directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart LR\n" + cleaned;
    } else {
      // Replace TD with LR direction for better fit
      cleaned = cleaned.replace(/flowchart\s+TD/i, "flowchart LR");
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
      validLines.push("A[The document contains important information] --> B[Review the full document for details]");
    }
    
    // Add styling for rounded corners if not already present
    if (!validLines.some(line => line.includes('classDef'))) {
      validLines.push(`
%% Node styling with rounded corners
classDef concept fill:#e6f3ff,stroke:#4a86e8,stroke-width:2px,rx:15px,ry:15px
classDef process fill:#e6ffe6,stroke:#6aa84f,stroke-width:2px,rx:15px,ry:15px
classDef highlight fill:#fff2cc,stroke:#f1c232,stroke-width:2px,rx:15px,ry:15px
classDef main fill:#d9d2e9,stroke:#8e7cc3,stroke-width:2px,rx:15px,ry:15px`);
      
      // Apply styling to first few nodes automatically
      validLines.push(`
%% Apply styling to nodes
class A,B,C main
class D,E,F process
class G,H,I concept
class J,K,L highlight`);
    }
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning Mermaid syntax:", error);
    return `flowchart LR
      A[Error occurred while cleaning diagram syntax] --> B[The system encountered an unexpected issue]
      B --> C[Please try uploading a different document]`;
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
        root((No PDF Content))
          No document was found
            Please upload a PDF file first`;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a detailed Mermaid mindmap based on this document text.
    
    CRITICAL REQUIREMENTS:
    1. Start with 'mindmap'
    2. Use proper indentation for hierarchy (2 spaces per level)
    3. Use a descriptive root node title that captures the document's main topic
    4. Use complete sentences or detailed phrases for all nodes (not just keywords)
    5. Include at least 3 levels of hierarchy with 15-20 nodes total
    6. Organize information logically with main concepts as first level, supporting details as second level
    7. Each branch should follow a coherent thought process from general to specific
    
    MERMAID SYNTAX RULES:
    1. Root node must use: root((Complete title of document or main topic))
    2. First level nodes are just text with proper indentation
    3. Use node styling variations for visual hierarchy:
       - Text in square brackets [Important concept]
       - Text in parentheses (Supporting fact)
       - Text in double parentheses ((Key finding))
    4. Keep nodes concise but informative (5-12 words)
    
    EXAMPLE OF GOOD MINDMAP FORMAT:
    mindmap
      root((Machine Learning Applications in Healthcare))
        Diagnostic Support Systems
          [AI models achieve 95% accuracy in radiology]
          (Deep learning identifies patterns human radiologists miss)
        Treatment Optimization
          [Personalized medicine based on patient data]
          (Drug efficacy prediction using neural networks)
        Administrative Efficiency
          [Automated scheduling reduces wait times]
    
    Here's the document text:
    ${pdfText.slice(0, 10000)}
    
    Generate ONLY valid Mermaid mindmap code, nothing else.
    Make sure to include the main points, findings, and structure from the document.
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
      root((Error Processing Document))
        Failed to generate mindmap
          Please try again with a different document
        Possible reasons
          [Document format may not be compatible]
          [Text extraction might have failed]`;
  }
};

// Helper function to clean and fix common Mermaid mindmap syntax issues
const cleanMindmapSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `mindmap
      root((Error))
        Empty mindmap
          Please try again with a different document`;
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
      
      validLines.push(fixedLine);
    });
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning mindmap syntax:", error);
    return `mindmap
      root((Error))
        Syntax Cleaning Failed
          Please try again with a different document`;
  }
};
