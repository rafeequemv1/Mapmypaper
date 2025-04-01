import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (for security reasons)
const genAI = new GoogleGenerativeAI(import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

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

// Function to generate structured summary of PDF content
export const generateStructuredSummary = async (): Promise<any> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return {
        Summary: "No PDF content found. Please upload a PDF first.",
        "Key Findings": "N/A",
        Objectives: "N/A",
        Methods: "N/A",
        Results: "N/A", 
        Conclusions: "N/A",
        "Key Concepts": "N/A"
      };
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate structured summary with Gemini
    const result = await model.generateContent(`
    Create a comprehensive structured summary of this academic paper or document. 
    Include citations to specific pages where relevant using [citation:pageX] format.
    
    Return the result as a structured object with the following sections:
    - Summary: Overall summary of the paper in 2-3 paragraphs
    - Key Findings: 3-5 main findings or takeaways
    - Objectives: What the paper aims to achieve
    - Methods: How the research was conducted
    - Results: Main results with citations
    - Conclusions: Key conclusions and implications
    - Key Concepts: List of 5-7 important concepts or terms

    Document Content:
    ${pdfText.slice(0, 15000)}
    `);
    
    const response = result.response.text();
    
    // Parse the response to extract structured data
    try {
      // Try to parse as JSON if the format is clean
      if (response.includes('{') && response.includes('}')) {
        const jsonStr = response.substring(
          response.indexOf('{'),
          response.lastIndexOf('}') + 1
        );
        return JSON.parse(jsonStr);
      }
      
      // Otherwise, parse section by section
      const sections = {
        Summary: extractSection(response, "Summary"),
        "Key Findings": extractSection(response, "Key Findings"),
        Objectives: extractSection(response, "Objectives"),
        Methods: extractSection(response, "Methods"),
        Results: extractSection(response, "Results"),
        Conclusions: extractSection(response, "Conclusions"),
        "Key Concepts": extractSection(response, "Key Concepts")
      };
      
      return sections;
    } catch (parseError) {
      console.error("Error parsing structured summary:", parseError);
      return {
        Summary: response,
        "Key Findings": "Parsing error",
        Objectives: "Parsing error",
        Methods: "Parsing error",
        Results: "Parsing error",
        Conclusions: "Parsing error",
        "Key Concepts": "Parsing error"
      };
    }
  } catch (error) {
    console.error("Gemini API error generating summary:", error);
    return {
      Summary: "Failed to generate summary. Please try again.",
      "Key Findings": "Error",
      Objectives: "Error",
      Methods: "Error",
      Results: "Error",
      Conclusions: "Error",
      "Key Concepts": "Error"
    };
  }
};

// Helper function to extract sections from AI response
const extractSection = (text: string, sectionName: string): string => {
  const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\w+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : `No ${sectionName} section found`;
};

// Function to generate mindmap from PDF text
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

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate the mindmap from the PDF text with Gemini
    const result = await model.generateContent(`
    Create a detailed Mermaid mindmap based on this document text.
    
    CRITICAL MERMAID MINDMAP SYNTAX RULES:
    1. Start with 'mindmap' on its own line
    2. Use indentation to show hierarchy (2 spaces per level)
    3. Use syntax for nodes:
       - Root node: root((Text))
       - Regular nodes: Text
       - Node with ID: id[Text]
       - Show node classes with triple colons: root((Text)):::className
    4. Follow this structure for a paper:
       - Root node: Main topic/title
       - First level: Key sections (Summary, Key Concepts, Methods, Results, etc)
       - Second level: Important sub-topics and findings
       - Third level: Specific details and evidence
       - Fourth level: Additional context where needed
    
    IMPORTANT: The mindmap MUST explain the entire structure of the paper from:
    - WHY (motivation/problem statement)
    - HOW (methodology/approach)
    - WHAT (findings/conclusions)
    
    Also include branches for limitations and future work.
    
    For node styling, add several class definitions at the end to style different types of nodes.
    
    EXAMPLE CORRECT SYNTAX:
    mindmap
      root((Paper Topic))
        Summary
          Key Point 1
          Key Point 2
        Methods
          Method 1
            Detail 1.1
            Detail 1.2
        Results
          Finding 1
          Finding 2

    Document Content: 
    ${pdfText.slice(0, 15000)}
    `);
    
    // Extract the mindmap code from the result
    let mindmapCode = result.response.text();
    
    // If the response contains markdown code block, extract just the code
    if (mindmapCode.includes('```mermaid')) {
      mindmapCode = mindmapCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (mindmapCode.includes('```')) {
      mindmapCode = mindmapCode.split('```')[1].split('```')[0].trim();
    }
    
    // Ensure it starts with mindmap directive
    if (!mindmapCode.trim().startsWith('mindmap')) {
      mindmapCode = 'mindmap\n' + mindmapCode;
    }
    
    return mindmapCode;
  } catch (error) {
    console.error("Gemini API mindmap generation error:", error);
    return `mindmap
  root((Error))
    Failed to generate mindmap
      Please try again`;
  }
};

// Function to generate sequence diagram from PDF content
export const generateSequenceDiagramFromPdf = async (): Promise<string> => {
  try {
    // Retrieve stored PDF text from sessionStorage
    const pdfText = sessionStorage.getItem('pdfText');
    
    if (!pdfText || pdfText.trim() === '') {
      return `sequenceDiagram
    participant User
    participant System
    User->>System: Interact
    System->>User: No PDF Content
    Note over User,System: Please upload a PDF first`;
    }

    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate the sequence diagram from the PDF text with Gemini
    const result = await model.generateContent(`
    Create a detailed Mermaid sequence diagram based on this academic paper or document.
    Focus on any processes, methodologies, or workflows described in the paper.
    
    CRITICAL MERMAID SEQUENCE DIAGRAM SYNTAX RULES:
    1. Start with 'sequenceDiagram' on its own line
    2. Define participants with: participant Name
    3. Show interactions with arrows: ParticipantA->>ParticipantB: Action
    4. Use -->> for response arrows
    5. Add notes with: Note over ParticipantA,ParticipantB: Note text
    6. Use loops and alternatives where appropriate:
       loop Loop text
         Actions
       end
       alt Alternative 1
         Actions
       else Alternative 2
         Actions
       end
    
    IMPORTANT: The sequence diagram should:
    - Identify key actors/components in the process
    - Show the flow of actions in the correct order
    - Include important decision points
    - Represent the core workflow or method described in the paper
    - If the paper doesn't describe a clear process, create a sequence diagram of how the research was conducted
    
    Document Content: 
    ${pdfText.slice(0, 15000)}
    `);
    
    // Extract the sequence diagram code from the result
    let diagramCode = result.response.text();
    
    // If the response contains markdown code block, extract just the code
    if (diagramCode.includes('```mermaid')) {
      diagramCode = diagramCode.split('```mermaid')[1].split('```')[0].trim();
    } else if (diagramCode.includes('```')) {
      diagramCode = diagramCode.split('```')[1].split('```')[0].trim();
    }
    
    // Ensure it starts with sequenceDiagram directive
    if (!diagramCode.trim().startsWith('sequenceDiagram')) {
      diagramCode = 'sequenceDiagram\n' + diagramCode;
    }
    
    return diagramCode;
  } catch (error) {
    console.error("Gemini API sequence diagram generation error:", error);
    return `sequenceDiagram
    participant Error
    participant User
    Error->>User: Failed to generate diagram
    Note over Error,User: Please try again`;
  }
};

// Function to generate mind map from text - used in PDF upload
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    if (!text || text.trim() === '') {
      throw new Error("No text content provided");
    }

    // Store the extracted text in sessionStorage for other components to use
    sessionStorage.setItem('pdfText', text);
    
    // Initialize the Generative Model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate structured mind map data with Gemini
    const result = await model.generateContent(`
    Create a structured mind map data structure based on this document text.
    
    Return the result as a JSON object with the following structure:
    {
      "title": "Main Paper Title",
      "summary": "Brief 1-2 paragraph summary of the overall paper",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "branches": [
        {
          "name": "Branch Name (e.g., Introduction, Methods, etc)",
          "children": [
            {
              "name": "Sub-topic 1",
              "children": [
                {"name": "Detail point 1"},
                {"name": "Detail point 2"}
              ]
            },
            {
              "name": "Sub-topic 2",
              "children": []
            }
          ]
        }
      ]
    }
    
    Make sure to:
    - Include 3-5 main branches representing key sections of the paper
    - Each branch should have 2-4 sub-topics
    - Add detail points where appropriate
    - Be comprehensive but focused on the most important aspects
    - The structure should follow the paper's flow from introduction to conclusion
    
    Document Content:
    ${text.slice(0, 15000)}
    `);
    
    const response = result.response.text();
    
    // Parse the response to extract JSON data
    try {
      // Find JSON content between curly braces
      const jsonStr = response.substring(
        response.indexOf('{'),
        response.lastIndexOf('}') + 1
      );
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing mind map JSON:", parseError);
      // Return a basic structure if parsing fails
      return {
        title: "Document Analysis",
        summary: "Failed to parse structured data from document.",
        keyPoints: ["Please try regenerating the mind map"],
        branches: [
          {
            name: "Document Content",
            children: [
              { name: "Content available in preview", children: [] }
            ]
          }
        ]
      };
    }
  } catch (error) {
    console.error("Gemini API error generating mind map data:", error);
    throw new Error("Failed to generate mind map data from text");
  }
};

// Function to generate flowchart from PDF content with LR direction and detail level
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
