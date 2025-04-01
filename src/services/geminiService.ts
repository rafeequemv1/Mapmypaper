import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (for security reasons)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDTLG_PFXTvuYCOS_i8eP-btQWAJDb5rDk");

// Function to generate a mind map from text using Gemini API
export const generateMindMapFromText = async (text: string): Promise<any> => {
  try {
    // First, store the text in session storage for later reference
    sessionStorage.setItem('pdfText', text);

    // Initialize the Generative Model for text generation
    const model = genAI.getModel({ model: 'gemini-pro' });
    
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

    // Generate content with the prompt
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from the response
      let jsonStr = response;
      
      // Handle cases where the response includes markdown code blocks
      if (response.includes("```json")) {
        jsonStr = response.split("```json")[1].split("```")[0].trim();
      } else if (response.includes("```")) {
        jsonStr = response.split("```")[1].split("```")[0].trim();
      }
      
      // Parse the JSON response
      let mindMapData;
      try {
        mindMapData = JSON.parse(jsonStr);
        
        // Ensure the structure is valid
        if (!mindMapData.id || !mindMapData.topic || !Array.isArray(mindMapData.children)) {
          console.warn("Invalid mind map structure returned by API, using template");
          mindMapData = researchPaperTemplate;
        }
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError);
        mindMapData = researchPaperTemplate;
      }
      
      // Save the mind map data to session storage for use in MindMap component
      sessionStorage.setItem('mindMapData', JSON.stringify(mindMapData));
      
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
    const model = genAI.getModel({ model: 'gemini-pro' });
    
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

// For generating mindmaps from PDF content
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
    const model = genAI.getModel({ model: 'gemini-pro' });
    
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
    5. You can use icons: ::icon(fa fa-book)
    6. You can define classes for styling: :::className
    
    EXAMPLE CORRECT SYNTAX:
    mindmap
      root((Paper Topic))
        Introduction
          Background:::highlight
            Key Point 1
            Key Point 2
          Research Question
            Question 1
            Question 2::icon(fa fa-question)
        Methodology
          Data Collection
          Analysis
        Results
          Finding 1:::important
          Finding 2
        Conclusion
          Summary
          Future Work

    classDef highlight fill:#f9f,stroke:#333
    classDef important fill:#bbf,stroke:#33f
    
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

    return mermaidCode;
  } catch (error) {
    console.error("Gemini API mindmap generation error:", error);
    return `mindmap
      root((Error))
        Failed to generate mindmap
          Please try again`;
  }
};

// New function to generate a structured summary of the PDF content
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
    const model = genAI.getModel({ model: 'gemini-pro' });
    
    // Generate a structured summary from the PDF text
    const result = await model.generateContent(`
    Analyze this academic paper or document and create a comprehensive, structured summary with the following sections.
    Each section should contain citations to specific pages in the format [citation:pageX] where X is the page number:

    Document Content:
    ${pdfText.slice(0, 20000)}
    
    Please provide the following structure EXACTLY, maintaining these exact headings in this order:
    
    1. Summary: A concise overview of the entire document in 3-5 sentences
    2. Key Findings: The 3-5 most important discoveries or conclusions
    3. Objectives: The main goals or research questions of the document
    4. Methods: The approach, techniques, or methodologies used
    5. Results: The outcomes or findings from the research
    6. Conclusions: The implications and significance of the findings
    7. Key Concepts: A list of 5-10 important terms or concepts introduced or discussed
    
    IMPORTANT FORMATTING INSTRUCTIONS:
    - Include page citations in the format [citation:pageX] where X is the page number
    - Be concise but comprehensive
    - Use bullet points for lists when appropriate
    - Make each section clearly distinct
    - Return the response as a valid JSON object with each section as a property
    - Do NOT include any explanations or additional text outside the JSON structure
    - Do NOT use properties that are not in the list above
    - Include at least 2-3 citations per section
    
    EXAMPLE OUTPUT FORMAT:
    {
      "Summary": "This paper explores...[citation:page2] The authors find...[citation:page5]",
      "Key Findings": "1. Finding one...[citation:page3]\n2. Finding two...[citation:page4]",
      "Objectives": "...",
      "Methods": "...",
      "Results": "...",
      "Conclusions": "...",
      "Key Concepts": "..."
    }
    
    Only provide the JSON output, nothing else.
    `);
    
    // Extract the JSON response
    const responseText = result.response.text();
    
    // Parse the JSON from the response
    try {
      // Try to parse the direct response
      const jsonResponse = JSON.parse(responseText);
      return jsonResponse;
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      if (responseText.includes('```json')) {
        const jsonContent = responseText.split('```json')[1].split('```')[0].trim();
        return JSON.parse(jsonContent);
      } else if (responseText.includes('```')) {
        const jsonContent = responseText.split('```')[1].split('```')[0].trim();
        return JSON.parse(jsonContent);
      } else {
        // If JSON parsing fails, return a structured error
        console.error("Failed to parse Gemini API response", parseError);
        return {
          Summary: "Could not generate a proper summary. The AI response was not in the expected format.",
          "Key Findings": "Error in processing",
          Objectives: "Error in processing",
          Methods: "Error in processing",
          Results: "Error in processing",
          Conclusions: "Error in processing",
          "Key Concepts": "Error in processing"
        };
      }
    }
  } catch (error) {
    console.error("Gemini API summary generation error:", error);
    return {
      Summary: "An error occurred while generating the summary.",
      "Key Findings": "API Error",
      Objectives: "API Error",
      Methods: "API Error",
      Results: "API Error",
      Conclusions: "API Error",
      "Key Concepts": "API Error"
    };
  }
};
