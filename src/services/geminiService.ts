import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the provided API key
const API_KEY = "AIzaSyBeJ0uXu58YfxYK32VB1wf1ODrFvrL9gi8";
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper function to clean and validate Mermaid syntax
export const cleanMermaidSyntax = (input: string): string => {
  let cleaned = input.trim();
  
  // Fix common syntax errors
  cleaned = cleaned
    // Fix arrows if needed
    .replace(/-+>/g, "-->")
    // Replace any hyphens in node IDs with underscores
    .replace(/(\w+)-(\w+)/g, "$1_$2");
  
  // Ensure it starts with flowchart directive and uses LR direction
  if (!cleaned.startsWith("flowchart")) {
    cleaned = "flowchart LR\n" + cleaned;
  } else if (cleaned.startsWith("flowchart TD")) {
    // Replace TD with LR if found at the beginning
    cleaned = cleaned.replace("flowchart TD", "flowchart LR");
  }
  
  // Process line by line to ensure each line is valid
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    // Skip empty lines or lines starting with flowchart, subgraph, or end
    if (!line.trim() || 
        line.trim().startsWith('flowchart') || 
        line.trim().startsWith('subgraph') || 
        line.trim() === 'end') {
      return line;
    }
    
    // Handle node definitions with text containing hyphens
    // Replace hyphens inside node text brackets
    let processedLine = line;
    
    // Handle square brackets []
    processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
      return '[' + p1 + ' ' + p2 + ']';
    });
    
    // Handle parentheses ()
    processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
      return '(' + p1 + ' ' + p2 + ')';
    });
    
    // Handle curly braces {}
    processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
      return '{' + p1 + ' ' + p2 + '}';
    });
    
    // Replace all remaining dashes in node text with spaces or underscores
    // This needs to run multiple times to catch all hyphens in text
    for (let i = 0; i < 3; i++) {
      // Handle square brackets []
      processedLine = processedLine.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle parentheses ()
      processedLine = processedLine.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle curly braces {}
      processedLine = processedLine.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
    }
    
    return processedLine;
  });
  
  return processedLines.join('\n');
};

// Function to generate a mind map from text using Gemini API
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    console.log("Generating mind map from text with length:", text.length);
    
    // First, store the text in session storage for later reference
    sessionStorage.setItem('pdfText', text);

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log("Using API key:", API_KEY);
    console.log("Model initialized");
    
    // Create a template for research paper structure as mind map
    const researchPaperTemplate = {
      id: 'root',
      topic: 'Research Paper',
      children: [
        {
          id: 'c1',
          topic: 'Introduction',
          children: [
            { id: 'c1-1', topic: 'Background' },
            { id: 'c1-2', topic: 'Problem Statement' },
            { id: 'c1-3', topic: 'Research Questions' }
          ]
        },
        {
          id: 'c2',
          topic: 'Methodology',
          children: [
            { id: 'c2-1', topic: 'Research Design' },
            { id: 'c2-2', topic: 'Data Collection' },
            { id: 'c2-3', topic: 'Analysis Methods' }
          ]
        },
        {
          id: 'c3',
          topic: 'Results',
          children: []
        },
        {
          id: 'c4',
          topic: 'Discussion',
          children: [
            { id: 'c4-1', topic: 'Interpretation of Findings' },
            { id: 'c4-2', topic: 'Limitations' },
            { id: 'c4-3', topic: 'Future Work' }
          ]
        },
        {
          id: 'c5',
          topic: 'Conclusion',
          children: []
        }
      ]
    };
    
    // If the text is very short, return the template
    if (text.length < 100) {
      console.log("Text is too short, returning template");
      return researchPaperTemplate;
    }
    
    // Define prompt for Gemini API to generate structure
    const prompt = `
    I have a research paper with the following content (first 5000 characters):
    "${text.slice(0, 5000)}..."

    Please analyze this content and create a JSON structure for a mind map that represents the paper's structure.
    The mind map should include key topics, findings, methodologies, and conclusions from the paper.
    Format the response as a JSON object with the following structure:
    {
      "id": "root",
      "topic": "[PAPER TITLE]",
      "children": [
        {
          "id": "c1",
          "topic": "[MAIN TOPIC 1]",
          "children": [
            { "id": "c1-1", "topic": "[SUBTOPIC 1]" },
            { "id": "c1-2", "topic": "[SUBTOPIC 2]" }
          ]
        },
        ...more main topics
      ]
    }

    Make sure to:
    1. Include at least 5 main topics (like Introduction, Methodology, Results, Discussion, Conclusion)
    2. For each main topic, include 2-5 relevant subtopics based on the paper content
    3. Keep topic names concise (1-5 words)
    4. Ensure the structure accurately reflects the paper's content and organization
    5. Use unique IDs for each node (like c1, c1-1, c2, etc.)
    
    ONLY return the JSON structure, nothing else.
    `;

    console.log("Sending prompt to Gemini API");
    
    // Generate content with the prompt
    try {
      const result = await model.generateContent(prompt);
      console.log("Received response from Gemini API");
      const response = await result.response.text();
      
      // Extract JSON from the response
      let jsonStr = response;
      
      // Handle cases where the response includes markdown code blocks
      if (response.includes("```json")) {
        jsonStr = response.split("```json")[1].split("```")[0].trim();
      } else if (response.includes("```")) {
        jsonStr = response.split("```")[1].split("```")[0].trim();
      }
      
      console.log("Extracted JSON string:", jsonStr.substring(0, 100) + "...");
      
      // Parse the JSON response
      let mindMapData;
      try {
        mindMapData = JSON.parse(jsonStr);
        console.log("Successfully parsed JSON");
        
        // Ensure the structure is valid
        if (!mindMapData.id || !mindMapData.topic || !Array.isArray(mindMapData.children)) {
          console.warn("Invalid mind map structure returned by API, using template");
          mindMapData = researchPaperTemplate;
        } else {
          console.log("Mind map structure is valid");
        }
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError);
        mindMapData = researchPaperTemplate;
      }
      
      // Save the mind map data to session storage for use in MindMap component
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      console.log("Saved mind map data to session storage");
      
      return mindMapData;
    } catch (apiError) {
      console.error("Error calling Gemini API:", apiError);
      return researchPaperTemplate;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};

// Function to chat with Gemini about the PDF content
export const chatWithGeminiAboutPdf = async (prompt: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');

    if (!pdfText || pdfText.trim() === '') {
      return "Please upload a PDF document first.";
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Enhanced prompt to provide more context and instructions
    const fullPrompt = `You are a research assistant helping a user understand a research paper.
      The paper is about: ${pdfText.substring(0, 500)}
      Here is the relevant content of the paper: ${pdfText}
      User's question: ${prompt}
      Please provide a concise and informative answer, referencing specific sections or page numbers where appropriate.`;

    // Generate content with the enhanced prompt
    const result = await model.generateContent(fullPrompt);
    const response = await result.response.text();

    return response;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

// Add missing structured summary generator function
export const generateStructuredSummary = async (): Promise<Record<string, string>> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return {
        error: "No PDF content available. Please upload a document first."
      };
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Define prompt for structured summary generation
    const prompt = `
    Generate a structured summary of this research paper. The text is:
    
    ${pdfText.slice(0, 15000)}
    
    Create sections for:
    1. Key Findings
    2. Methodology
    3. Limitations
    4. Future Research
    5. Practical Applications
    
    Format your response as plain text with section headers.
    Make each section concise but comprehensive (3-5 sentences each).
    Use academic language appropriate for the paper's field.
    Include specific details from the paper, not generic statements.
    `;

    // Generate the structured summary
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    // Split response into sections
    const sections = {
      "Key Findings": "",
      "Methodology": "",
      "Limitations": "",
      "Future Research": "",
      "Practical Applications": ""
    };
    
    let currentSection = "";
    
    // Parse the response into sections
    const lines = response.split('\n');
    for (const line of lines) {
      // Check if line is a section header
      if (line.match(/^[0-9]\.\s*Key Findings/i)) {
        currentSection = "Key Findings";
      } else if (line.match(/^[0-9]\.\s*Methodology/i)) {
        currentSection = "Methodology";
      } else if (line.match(/^[0-9]\.\s*Limitations/i)) {
        currentSection = "Limitations";
      } else if (line.match(/^[0-9]\.\s*Future Research/i)) {
        currentSection = "Future Research";
      } else if (line.match(/^[0-9]\.\s*Practical Applications/i)) {
        currentSection = "Practical Applications";
      } else if (currentSection && line.trim()) {
        // Add content to current section
        sections[currentSection] += line + "\n";
      }
    }
    
    return sections;
  } catch (error) {
    console.error("Error generating structured summary:", error);
    return {
      error: "Failed to generate summary. Please try again."
    };
  }
};

// New function to generate flowchart from PDF content with LR direction and detail level
export const generateFlowchartFromPdf = async (detailLevel: 'low' | 'medium' | 'high' = 'medium'): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `flowchart LR
        A[Error] --> B[No PDF Content]
        B --> C[Please upload a PDF first]`;
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Define detail level-specific instructions
    let detailInstructions = '';
    let nodeCount = '';
    
    switch (detailLevel) {
      case 'low':
        detailInstructions = 'Create a simple overview flowchart focusing only on the main concepts and high-level relationships.';
        nodeCount = 'Use 5-10 nodes only.';
        break;
      case 'high':
        detailInstructions = 'Create a comprehensive, detailed flowchart covering all major aspects of the document including the why, how, and what. Use multiple branches and parallel processes where appropriate.';
        nodeCount = 'Include 15-25 nodes with detailed connections.';
        break;
      case 'medium':
      default:
        detailInstructions = 'Create a balanced flowchart showing the main concepts and their key relationships.';
        nodeCount = 'Use 10-15 nodes with clear connections.';
    }
    
    // Generate the flowchart from the PDF text with Gemini
    const result = await model.generateContent(`
    Create a ${detailLevel}-detail Mermaid flowchart based on this document text.
    ${detailInstructions}
    ${nodeCount}
    
    The flowchart should explain the paper's structure from "why" (motivation/problem) to "how" (methodology/approach) to "what" (findings/conclusions).
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'flowchart LR' (MUST use Left-to-Right direction)
    2. Nodes MUST have this format: A[Text] or A(Text) or A{Text} - no exceptions
    3. Node IDs MUST be simple alphanumeric: A, B, C1, process1 (NO special chars or hyphens)
    4. Connections MUST use EXACTLY TWO dashes: A --> B (not A->B or A---->B)
    5. For labeled connections use: A -->|Yes| B or A -->|No| C
    6. For decision nodes use: A{Decision?}
    7. For process nodes use: B[Process]
    8. For input/output use: C(Input/Output)
    9. For subgraphs use: subgraph Title\\n...nodes...\\nend
    10. IMPORTANT: Node IDs can only be used once! 
    11. IMPORTANT: Simple node text is best - keep it short, avoid special characters
    12. Use different node styles for different types of content:
        - Use rectangles [text] for main processes and concepts
        - Use rounded boxes (text) for inputs/outputs
        - Use diamonds {text} for decisions/questions
        - Use hexagons {{text}} for important highlights
    13. IMPORTANT: Add colors to make the flowchart more visually appealing:
        - style important_node fill:#f9f,stroke:#333,stroke-width:2px
        - style decision_node fill:#bbf,stroke:#33f
        - style process_node fill:#bfb,stroke:#3f3
        - Add at least 5 different colored nodes
    
    EXAMPLE CORRECT SYNTAX:
    flowchart LR
      A[Start] --> B{Decision}
      B -->|Yes| C[Process One]
      B -->|No| D[Process Two]
      C --> E[End]
      D --> E
      style A fill:#bbf,stroke:#33f,stroke-width:2px
      style E fill:#f9f,stroke:#333,stroke-width:2px
    
    Document Content: 
    ${pdfText.slice(0, 15000)}
    `);
    
    // Extract the Mermaid code from the result
    const mermaidCode = await result.response.text();
    
    // If the response contains the Mermaid code block, extract just the code
    let cleanedCode = mermaidCode;
    if (mermaidCode.includes('```mermaid')) {
      cleanedCode = mermaidCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (mermaidCode.includes('```')) {
      cleanedCode = mermaidCode.split('```')[1].split('```')[0].trim();
    }
    
    return cleanMermaidSyntax(cleanedCode);
  } catch (error) {
    console.error("Gemini API flowchart generation error:", error);
    return `flowchart LR
      A[Error] --> B[Failed to generate flowchart]
      B --> C[Please try again]
      style A fill:#ffcccc,stroke:#ff0000,stroke-width:2px
      style B fill:#ffdddd,stroke:#ff0000
      style C fill:#ffeeee,stroke:#ff0000`;
  }
};

// Generate sequence diagrams from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `sequenceDiagram
        participant U as User
        participant S as System
        U->>S: Request
        S->>U: Error (No PDF Content)
        Note over U,S: Please upload a PDF first`;
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate the sequence diagram from the PDF text with Gemini
    const result = await model.generateContent(`
    Create a Mermaid sequence diagram based on this document text.
    
    CRITICAL MERMAID SEQUENCE DIAGRAM SYNTAX RULES:
    1. Start with 'sequenceDiagram'
    2. Define participants with labels: participant A as System A
    3. Show interactions with arrows: A->>B: Request data
    4. Use solid arrows for synchronous calls: A->>B
    5. Use dashed arrows for responses: B-->>A
    6. Add notes: Note over A,B: This is a note
    7. Add loops: loop Every minute
    8. Add conditionals: alt Successful case
    9. Keep participant names short (1-2 words max)
    10. Use clear, concise messages (3-5 words)
    
    Document content:
    ${pdfText.slice(0, 15000)}
    
    Create a sequence diagram that represents the key processes, interactions, or methodology described in the document.
    If the document doesn't explicitly describe a sequence or process, create a diagram showing how the concepts presented might interact in a practical application.
    Keep the diagram to 5-10 participants and 10-20 interactions maximum.
    `);
    
    // Extract the sequence diagram code from the result
    const sequenceCode = await result.response.text();
    
    // Process the response to extract just the diagram code
    let cleanedCode = sequenceCode;
    if (sequenceCode.includes('```mermaid')) {
      cleanedCode = sequenceCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (sequenceCode.includes('```')) {
      cleanedCode = sequenceCode.split('```')[1].split('```')[0].trim();
    }
    
    // Further clean the code to handle common syntax issues
    return cleanSequenceDiagramSyntax(cleanedCode);
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    return `sequenceDiagram
      participant U as User
      participant S as System
      participant E as Error
      U->>S: Generate diagram
      S->>E: Processing failed
      E-->>U: Error message
      Note over U,S: Please try again`;
  }
};

// Clean sequence diagram syntax
const cleanSequenceDiagramSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `sequenceDiagram
      participant U as User
      participant S as System
      U->>S: Request
      S-->>U: Response`;
  }

  try {
    // Ensure the code starts with sequenceDiagram directive
    let cleaned = code.trim();
    if (!cleaned.startsWith("sequenceDiagram")) {
      cleaned = "sequenceDiagram\n" + cleaned;
    }

    // Remove any empty lines
    cleaned = cleaned
      .split('\n')
      .filter(line => line.trim())
      .join('\n');
    
    return cleaned;
  } catch (error) {
    console.error("Error cleaning sequence diagram syntax:", error);
    return `sequenceDiagram
      participant E as Error
      participant S as System
      E->>S: Syntax cleaning failed
      S-->>E: Using default diagram`;
  }
};

// Generate mindmap from PDF content
export const generateMindmapFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `mindmap
        root((Error))
          No PDF Content`;
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate the mindmap from the PDF text with Gemini
    const result = await model.generateContent(`
    Create a detailed Mermaid mindmap based on this academic document text.
    
    CRITICAL MERMAID MINDMAP SYNTAX RULES:
    1. Start with 'mindmap' keyword
    2. Root node must use double parentheses: root((Root Topic))
    3. Each level of indentation (using spaces, not tabs) creates a child node
    4. Node formats:
       - Root: root((Text))
       - Circle: (Text)
       - Square: [Text]
       - Rounded: (Text)
       - Default: Text
    
    Document Content: 
    ${pdfText.slice(0, 15000)}
    `);
    
    // Extract the Mermaid code from the result
    const mermaidCode = await result.response.text();
    
    // If the response contains the Mermaid code block, extract just the code
    let cleanedCode = mermaidCode;
    if (mermaidCode.includes('```mermaid')) {
      cleanedCode = mermaidCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (mermaidCode.includes('```')) {
      cleanedCode = mermaidCode.split('```')[1].split('```')[0].trim();
    }

    return cleanedCode;
  } catch (error) {
    console.error("Gemini API mindmap generation error:", error);
    return `mindmap
      root((Error))
        Failed to generate mindmap
          Please try again`;
  }
};

// New function to extract text from PDFs
export const extractAndStorePdfText = async (pdfFile: File): Promise<string> => {
  try {
    console.log("Starting PDF text extraction for:", pdfFile.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async function() {
        try {
          // Load PDF.js
          const pdfjsLib = await import("pdfjs-dist");
          console.log("PDF.js loaded successfully");
          
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
          
          // Get document
          const typedArray = new Uint8Array(this.result as ArrayBuffer);
          console.log("PDF loaded as typed array, length:", typedArray.length);
          
          const pdfDocument = await pdfjsLib.getDocument(typedArray).promise;
          console.log("PDF document loaded, pages:", pdfDocument.numPages);
          
          // Extract text from all pages
          let fullText = "";
          
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            if (pageNum > 20) {
              console.log("Limiting to first 20 pages to avoid performance issues");
              break; // Limit to first 20 pages to avoid performance issues
            }
            console.log("Processing page", pageNum);
            
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          
          console.log(`Extracted ${fullText.length} characters from PDF`);
          
          // Store in session storage
          sessionStorage.setItem("pdfText", fullText);
          sessionStorage.setItem("pdfName", pdfFile.name);
          console.log("PDF text stored in session storage");
          
          resolve(fullText);
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error("Error reading PDF:", error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(pdfFile);
    });
  } catch (error) {
    console.error("Overall PDF extraction error:", error);
    throw error;
  }
};
