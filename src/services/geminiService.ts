import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (for security reasons)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Function to chat with Gemini about the PDF content
export const chatWithGeminiAboutPdf = async (prompt: string): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');

    if (!pdfText || pdfText.trim() === '') {
      return "Please upload a PDF document first.";
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getModel({ model: 'gemini-pro' });

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
    const model = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").getModel({ model: 'gemini-pro' });
    
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
    `)
    .catch(error => {
      console.error("Error in generateFlowchartFromPdf:", error);
      throw error;
    });
    
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
