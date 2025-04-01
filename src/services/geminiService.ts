import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variable
const genAI = new GoogleGenerativeAI("AIzaSyAZ9kJmXbL4qTSQHHXpH4Y_9sXRxFH5gdk");

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
    const response = result.response.text();

    return response;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

// Function to generate MindMap from text
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    if (!text || text.trim() === '') {
      throw new Error("No text provided to generate mind map");
    }

    // Initialize the Generative Model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Create a hierarchical mind map structure based on the following text:
    ${text.substring(0, 15000)}
    
    Analyze the content and create a JSON structure following this format:
    {
      "nodeData": {
        "id": "root",
        "topic": "Main Topic",
        "children": [
          {
            "id": "1",
            "topic": "Subtopic 1",
            "children": [
              { "id": "1-1", "topic": "Detail 1" },
              { "id": "1-2", "topic": "Detail 2" }
            ]
          },
          {
            "id": "2",
            "topic": "Subtopic 2",
            "children": []
          }
        ]
      }
    }
    
    Important guidelines:
    1. Extract the main topic from the document title or first paragraph
    2. Create logical subtopics based on document sections/themes
    3. Add relevant details as child nodes
    4. Ensure each node has a unique ID
    5. Topic text should be concise (5-10 words maximum)
    6. Don't exceed 3 levels of hierarchy
    7. Include 5-10 main subtopics
    8. Return ONLY the JSON structure with no additional text
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    let jsonStr = response;
    if (response.includes('```json')) {
      jsonStr = response.split('```json')[1].split('```')[0].trim();
    } else if (response.includes('```')) {
      jsonStr = response.split('```')[1].split('```')[0].trim();
    }

    try {
      const parsedJson = JSON.parse(jsonStr);
      return parsedJson;
    } catch (parseError) {
      console.error("Error parsing mind map JSON:", parseError);
      // Return a basic structure if parsing fails
      return {
        nodeData: {
          id: 'root',
          topic: 'Document Analysis',
          children: [
            {
              id: '1',
              topic: 'Document Structure Error',
              children: [
                { id: '1-1', topic: 'Failed to parse content' }
              ]
            }
          ]
        }
      };
    }
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw error;
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
    let mermaidCode = result.response.text();
    
    // If the response contains the Mermaid code block, extract just the code
    if (mermaidCode.includes('```mermaid')) {
      mermaidCode = mermaidCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (mermaidCode.includes('```')) {
      mermaidCode = mermaidCode.split('```')[1].split('```')[0].trim();
    }
    
    return cleanMermaidSyntax(mermaidCode);
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

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidSyntax = (code: string): string => {
  if (!code || !code.trim()) {
    return `flowchart LR
      A[Error] --> B[Empty flowchart]
      B --> C[Please try again]
      style A fill:#ffcccc,stroke:#ff0000,stroke-width:2px`;
  }

  try {
    // Ensure the code starts with flowchart directive and uses LR direction
    let cleaned = code.trim();
    if (!cleaned.startsWith("flowchart")) {
      cleaned = "flowchart LR\n" + cleaned;
    } else if (cleaned.startsWith("flowchart TD")) {
      // Replace TD with LR if found at the beginning
      cleaned = cleaned.replace("flowchart TD", "flowchart LR");
    }

    // Process line by line to ensure each line is valid
    const lines = cleaned.split('\n').map(line => line.trim());
    const validLines = [];

    // Flag to track whether style definitions are present
    let hasStyleDefinitions = false;
    
    // Track node IDs to ensure they're unique
    const nodeIds = new Set();
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Skip empty lines
      if (!line) continue;
      
      // Handle flowchart directive
      if (line.startsWith("flowchart")) {
        validLines.push(line);
        continue;
      }
      
      // Check for style definitions
      if (line.startsWith("style ")) {
        hasStyleDefinitions = true;
        validLines.push(line);
        continue;
      }
      
      // Handle subgraph 
      if (line.startsWith("subgraph") || line === "end") {
        validLines.push(line);
        continue;
      }
      
      // Skip comment lines
      if (line.startsWith("%%")) {
        continue;
      }
      
      // Extract node IDs from connections
      const nodeMatch = line.match(/^([A-Za-z0-9_]+)(\[|\(|\{)/);
      if (nodeMatch) {
        const nodeId = nodeMatch[1];
        nodeIds.add(nodeId);
      }
      
      // Fix arrow syntax
      line = line.replace(/([A-Za-z0-9_]+)\s*-+>\s*([A-Za-z0-9_]+)/g, "$1 --> $2");
      
      // Fix labeled arrow syntax
      line = line.replace(/([A-Za-z0-9_]+)\s*-+>\|([^|]+)\|\s*([A-Za-z0-9_]+)/g, "$1 -->|$2| $3");
      
      // Handle node text with hyphens by replacing them with spaces
      line = line.replace(/\[([^\]]*)-([^\]]*)\]/g, function(match, p1, p2) {
        return '[' + p1 + ' ' + p2 + ']';
      });
      
      // Handle node text with hyphens in parentheses
      line = line.replace(/\(([^\)]*)-([^\)]*)\)/g, function(match, p1, p2) {
        return '(' + p1 + ' ' + p2 + ')';
      });
      
      // Handle node text with hyphens in curly braces
      line = line.replace(/\{([^\}]*)-([^\}]*)\}/g, function(match, p1, p2) {
        return '{' + p1 + ' ' + p2 + '}';
      });
      
      validLines.push(line);
    }
    
    // Add default style definitions if none present
    if (!hasStyleDefinitions && nodeIds.size > 0) {
      const nodeIdArray = Array.from(nodeIds);
      
      // Add style for decision nodes (typically with { })
      const decisionNodes = validLines
        .filter(line => /[A-Za-z0-9_]+\{[^}]*\}/.test(line))
        .map(line => {
          const match = line.match(/([A-Za-z0-9_]+)\{/);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);
      
      if (decisionNodes.length > 0) {
        validLines.push(`style ${decisionNodes[0]} fill:#bbf,stroke:#33f,stroke-width:2px`);
      }
      
      // Add style for first node
      if (nodeIdArray.length > 0) {
        validLines.push(`style ${nodeIdArray[0]} fill:#d0e0ff,stroke:#3080ff,stroke-width:2px`);
      }
      
      // Add style for last node
      if (nodeIdArray.length > 1) {
        validLines.push(`style ${nodeIdArray[nodeIdArray.length - 1]} fill:#ffe0d0,stroke:#ff8030,stroke-width:2px`);
      }
      
      // Add some random colors to other nodes
      const colors = [
        'fill:#d0ffe0,stroke:#30ff80', 
        'fill:#ffd0e0,stroke:#ff3080',
        'fill:#e0d0ff,stroke:#8030ff',
        'fill:#ffffd0,stroke:#aaaa30'
      ];
      
      for (let i = 1; i < Math.min(nodeIdArray.length - 1, colors.length + 1); i++) {
        const colorIndex = (i - 1) % colors.length;
        validLines.push(`style ${nodeIdArray[i]} ${colors[colorIndex]}`);
      }
    }
    
    return validLines.join('\n');
  } catch (error) {
    console.error("Error cleaning Mermaid syntax:", error);
    return `flowchart LR
      A[Error] --> B[Syntax Cleaning Failed]
      B --> C[Please try again]
      style A fill:#ffcccc,stroke:#ff0000,stroke-width:2px`;
  }
};

// Function to generate mindmap from PDF - referenced in useMindmapGenerator.ts
export const generateMindmapFromPdf = async (text: string): Promise<any> => {
  // This is essentially an alias for generateMindMapFromText for compatibility
  return generateMindMapFromText(text);
};

// Function to generate sequence diagram from PDF - referenced in useSequenceDiagramGenerator.ts
export const generateSequenceDiagramFromPdf = async (text: string): Promise<string> => {
  try {
    if (!text || text.trim() === '') {
      return "sequenceDiagram\n  Note over A: No text provided\n  A->>A: Please upload a PDF first";
    }

    // Initialize the Generative Model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Create a Mermaid sequence diagram based on this document text:
    ${text.substring(0, 10000)}
    
    CRITICAL MERMAID SYNTAX RULES:
    1. Start with 'sequenceDiagram'
    2. Use simple, short labels for actors
    3. Use A->B: message format for messages
    4. Use Note over A: text for notes
    5. Keep it focused on the main process/flow described in the document
    6. Limit to 10-15 interactions maximum
    7. Return ONLY valid Mermaid sequence diagram syntax
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract the Mermaid code
    let mermaidCode = response;
    if (response.includes('```mermaid')) {
      mermaidCode = response.split('```mermaid')[1].split('```')[0].trim();
    } else if (response.includes('```')) {
      mermaidCode = response.split('```')[1].split('```')[0].trim();
    }

    return mermaidCode;
  } catch (error) {
    console.error("Error generating sequence diagram:", error);
    return "sequenceDiagram\n  Note over System: Error occurred\n  System->>User: Failed to generate diagram";
  }
};

// Add the generateStructuredSummary function
export const generateStructuredSummary = async (): Promise<any> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return {
        Summary: "No PDF content available. Please upload a PDF first.",
        "Key Findings": "No content available",
        Objectives: "No content available",
        Methods: "No content available",
        Results: "No content available",
        Conclusions: "No content available",
        "Key Concepts": "No content available"
      };
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate structured summary with Gemini
    const result = await model.generateContent(`
    Analyze the following academic paper and create a structured summary with the following sections:
    1. Summary (1-2 paragraphs overview)
    2. Key Findings (3-5 bullet points)
    3. Objectives (what the paper aims to achieve)
    4. Methods (how the research was conducted)
    5. Results (main outcomes)
    6. Conclusions (what the results imply)
    7. Key Concepts (important terms and definitions from the paper)

    For each point in the Key Findings section, include a citation to the relevant page number like this: [citation:pageX] where X is the page number.
    
    Format your response as JSON with these exact keys: "Summary", "Key Findings", "Objectives", "Methods", "Results", "Conclusions", and "Key Concepts".
    
    Paper content:
    ${pdfText.slice(0, 15000)}
    `);
    
    // Extract the response text and parse it as JSON
    let responseText = result.response.text();
    
    // Extract JSON portion if wrapped in markdown code blocks
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      responseText = responseText.split('```')[1].split('```')[0].trim();
    }
    
    try {
      // Attempt to parse the JSON response
      const structuredSummary = JSON.parse(responseText);
      return structuredSummary;
    } catch (error) {
      console.error("Error parsing JSON summary:", error);
      
      // If JSON parsing fails, return a basic structure with an error message
      return {
        Summary: "Failed to generate a structured summary. The AI response could not be parsed correctly.",
        "Key Findings": "Parse error occurred",
        Objectives: "Parse error occurred",
        Methods: "Parse error occurred",
        Results: "Parse error occurred",
        Conclusions: "Parse error occurred",
        "Key Concepts": "Parse error occurred"
      };
    }
  } catch (error) {
    console.error("Error in generateStructuredSummary:", error);
    return {
      Summary: "An error occurred while generating the summary.",
      "Key Findings": "Error",
      Objectives: "Error",
      Methods: "Error",
      Results: "Error",
      Conclusions: "Error",
      "Key Concepts": "Error"
    };
  }
};
