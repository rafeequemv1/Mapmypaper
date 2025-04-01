import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Default mindmap diagram with enhanced colors and branch-based structure
export const defaultMindmap = `mindmap
  root((Paper Topic))
    Summary:::summary
      Key Points:::summaryDetail
      Main Contributions:::summaryDetail
      Significance:::summaryDetail
    Key Concept 1:::branch1
      Sub-concept 1.1:::subbranch1
        Detail 1.1.1:::detail1
        Detail 1.1.2:::detail1
      Sub-concept 1.2:::subbranch1
        Detail 1.2.1:::detail1
    Key Concept 2:::branch2
      Sub-concept 2.1:::subbranch2
        Detail 2.1.1:::detail2
        Detail 2.1.2:::detail2
      Sub-concept 2.2:::subbranch2
    Key Concept 3:::branch3
      Sub-concept 3.1:::subbranch3
        Detail 3.1.1:::detail3
        Detail 3.1.2:::detail3
        Sub-detail 3.1.2.1:::subdetail3

%% Color styling for different branches
classDef root fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px
classDef summary fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold
classDef summaryDetail fill:#333333,color:#ffffff,stroke:#000000,font-style:italic
classDef branch1 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef branch2 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef branch3 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef subbranch1 fill:#333333,color:#ffffff,stroke:#000000
classDef subbranch2 fill:#333333,color:#ffffff,stroke:#000000
classDef subbranch3 fill:#333333,color:#ffffff,stroke:#000000
classDef detail1 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef detail2 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef detail3 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef subdetail3 fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
`;

/**
 * Custom hook for generating and managing mindmap diagrams
 */
const useMindmapGenerator = () => {
  const [code, setCode] = useState<string>(defaultMindmap);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  /**
   * Generate a mindmap based on the PDF content in session storage
   */
  const generateMindmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get PDF text from session storage
      const pdfText = sessionStorage.getItem("pdfText");
      
      if (!pdfText) {
        throw new Error("No PDF content found. Please upload a PDF document first.");
      }

      const response = await generateMindmapFromPdf();
      
      if (response) {
        // Fix potential multiple root issues and add color styling
        const fixedResponse = fixMindmapSyntax(response);
        const enhancedResponse = addColorStylingToMindmap(fixedResponse);
        setCode(enhancedResponse);
      } else {
        throw new Error("Failed to generate a valid mindmap diagram.");
      }
    } catch (err) {
      console.error("Error generating mindmap:", err);
      setError(err instanceof Error ? err.message : "Unknown error generating mindmap");
      // Keep the default mindmap so there's something to display
      if (code !== defaultMindmap) {
        setCode(defaultMindmap);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Fix mindmap syntax to ensure there's only one root node
   */
  const fixMindmapSyntax = (mindmapCode: string): string => {
    // Check if the code starts with "mindmap" declaration
    if (!mindmapCode.trim().startsWith("mindmap")) {
      mindmapCode = "mindmap\n" + mindmapCode;
    }
    
    // Split the code into lines for processing
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    let foundRoot = false;
    let indentLevel = 0;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      
      // Skip empty lines
      if (!line.trim()) {
        processedLines.push('');
        continue;
      }
      
      // Keep mindmap declaration
      if (line.trim() === "mindmap") {
        processedLines.push(line);
        continue;
      }
      
      // Check for class definitions - keep them as is
      if (line.startsWith('classDef') || line.startsWith('%%')) {
        processedLines.push(line);
        continue;
      }
      
      // Calculate indentation
      const match = line.match(/^(\s*)/);
      const currentIndent = match ? match[0].length : 0;
      
      // Handle root node (double parentheses)
      if (line.includes('((') && line.includes('))') && !foundRoot) {
        // This is a valid root node
        foundRoot = true;
        indentLevel = currentIndent;
        processedLines.push(line);
      } 
      // Handle another root node or potential root
      else if (line.includes('((') && line.includes('))') && foundRoot) {
        // Convert to a regular node
        const convertedLine = line.replace(/\(\(([^)]*)\)\)/, '($1)');
        processedLines.push(convertedLine);
      }
      // Handle regular nodes
      else {
        processedLines.push(line);
      }
    }
    
    // If no root was found, add one at the beginning
    if (!foundRoot) {
      processedLines.splice(1, 0, "  root((Paper Topic))");
    }
    
    return processedLines.join('\n');
  };

  /**
   * Add color styling to mindmap code based on branch structure and content
   */
  const addColorStylingToMindmap = (mindmapCode: string): string => {
    // Check if the mindmap already has styling
    if (mindmapCode.includes('classDef')) {
      // Replace existing color values with black monochrome theme
      let updatedCode = mindmapCode.replace(/fill:#[a-fA-F0-9]+/g, 'fill:#000000');
      updatedCode = updatedCode.replace(/stroke:#[a-fA-F0-9]+/g, 'stroke:#000000');
      updatedCode = updatedCode.replace(/color:#[a-fA-F0-9]+/g, 'color:#ffffff');
      return updatedCode;
    }

    // Fix any potential syntax issues with class assignments
    // Ensure each class is on a new line after the node text
    let fixedCode = mindmapCode.replace(/\)\)\s*:::/g, '))\n    :::');
    fixedCode = fixedCode.replace(/\)\s*:::/g, ')\n    :::');
    fixedCode = fixedCode.replace(/([^\s])\s+:::/g, '$1\n    :::');
    
    // Split the mindmap code into lines
    const lines = fixedCode.split('\n');
    const processedLines: string[] = [];
    const branchClasses: string[] = [];
    
    // Keywords to special colors based on content
    const keywordMapping: Record<string, string> = {
      summary: 'summary',
      introduction: 'intro',
      background: 'background',
      method: 'method',
      experiment: 'experiment',
      result: 'result',
      discussion: 'discussion', 
      conclusion: 'conclusion',
      reference: 'reference',
      limitation: 'limitation',
      future: 'future',
      theory: 'theory',
      analysis: 'analysis',
      synthesis: 'synthesis',
      evaluation: 'evaluation',
    };

    // Process each line to add class identifiers
    let currentLevel = 0;
    let branchCounter = 0;
    let subBranchCounter = 0;
    let inHeader = true;
    let summaryFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        processedLines.push('');
        continue;
      }
      
      // If we're at a class definition or after, just add as is
      if (line.startsWith('classDef') || !inHeader) {
        processedLines.push(line);
        inHeader = false;
        continue;
      }
      
      // Calculate the indentation level
      const match = lines[i].match(/^\s*/);
      const indent = match ? match[0].length : 0;
      const level = indent / 2; // Assuming 2 spaces per level
      
      // Root node (mindmap declaration)
      if (line.startsWith('mindmap')) {
        processedLines.push(line);
        continue;
      }
      
      // Root node
      if (line.includes('((') && line.includes('))')) {
        // For the root node, add class on next line with proper indentation
        if (line.includes(':::')) {
          // Already has class, fix the format
          const [nodePart, classPart] = line.split(':::');
          processedLines.push(nodePart.trim());
          processedLines.push(`    :::${classPart.trim()}`);
        } else {
          processedLines.push(line);
          processedLines.push('    :::root');
        }
        branchCounter = 0;
      } 
      // Main branches (indent level 1)
      else if (level === 1) {
        branchCounter++;
        
        // Check if this is the summary branch - it should be the first branch
        if (line.toLowerCase().includes('summary') || (!summaryFound && branchCounter === 1)) {
          summaryFound = true;
          if (line.includes(':::')) {
            const [nodePart, _] = line.split(':::');
            processedLines.push(nodePart.trim());
            processedLines.push(`    :::summary`);
          } else {
            processedLines.push(line);
            processedLines.push(`    :::summary`);
          }
        }
        // Apply content-based classes if keywords are present
        else {
          const branchClass = `branch${branchCounter}`;
          branchClasses.push(branchClass);
          
          const lowerCaseLine = line.toLowerCase();
          const contentClass = Object.keys(keywordMapping).find(key => lowerCaseLine.includes(key));
          
          if (contentClass) {
            if (line.includes(':::')) {
              // Already has class, fix format
              const [nodePart, _] = line.split(':::');
              processedLines.push(nodePart.trim());
              processedLines.push(`    :::${keywordMapping[contentClass]}`);
            } else {
              processedLines.push(line);
              processedLines.push(`    :::${keywordMapping[contentClass]}`);
            }
          } else {
            if (line.includes(':::')) {
              // Already has class, fix format
              const [nodePart, _] = line.split(':::');
              processedLines.push(nodePart.trim());
              processedLines.push(`    :::${branchClass}`);
            } else {
              processedLines.push(line);
              processedLines.push(`    :::${branchClass}`);
            }
          }
        }
        
        subBranchCounter = 0;
        currentLevel = level;
      } 
      // Sub-branches and details
      else if (level > 1) {
        if (level > currentLevel) {
          subBranchCounter++;
        }
        
        const parentBranch = branchCounter > 0 ? branchCounter : 1;
        
        // Special handling for summary section children
        if (summaryFound && level === 2 && currentLevel === 1) {
          if (line.includes(':::')) {
            const [nodePart, _] = line.split(':::');
            processedLines.push(nodePart.trim());
            processedLines.push(`${'    '.repeat(level)}:::summaryDetail`);
          } else {
            processedLines.push(line);
            processedLines.push(`${'    '.repeat(level)}:::summaryDetail`);
          }
        } 
        else {
          // Choose class name based on depth
          let className = '';
          if (level === 2) className = `subbranch${parentBranch}`;
          else if (level === 3) className = `detail${parentBranch}`;
          else className = `subdetail${parentBranch}`;
          
          if (line.includes(':::')) {
            // Already has class, fix format
            const [nodePart, _] = line.split(':::');
            processedLines.push(nodePart.trim());
            processedLines.push(`${'    '.repeat(level)}:::${className}`);
          } else {
            processedLines.push(line);
            processedLines.push(`${'    '.repeat(level)}:::${className}`);
          }
        }
        
        currentLevel = level;
      } 
      // Keep other lines as they are
      else {
        processedLines.push(line);
      }
    }

    // Add style definitions at the end of the mindmap if they don't exist
    if (!processedLines.some(line => line.startsWith('classDef'))) {
      processedLines.push('\n%% Color styling for different branches - monochrome theme');
      processedLines.push('classDef root fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px');
      processedLines.push('classDef summary fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold');
      processedLines.push('classDef summaryDetail fill:#333333,color:#ffffff,stroke:#000000,font-style:italic');
      
      // Define branch colors - black/gray monochrome theme
      for (let i = 1; i <= Math.max(branchCounter, 3); i++) {
        processedLines.push(`classDef branch${i} fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px`);
        processedLines.push(`classDef subbranch${i} fill:#333333,color:#ffffff,stroke:#000000`);
        processedLines.push(`classDef detail${i} fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2`);
        processedLines.push(`classDef subdetail${i} fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3`);
      }
      
      // Add content-based styling in monochrome
      processedLines.push('classDef intro fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef background fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef method fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef experiment fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef result fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef discussion fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef conclusion fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef reference fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef limitation fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef future fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef theory fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef analysis fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('classDef synthesis fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('classDef evaluation fill:#111111,color:#ffffff,stroke:#000000');
    }

    return processedLines.join('\n');
  };

  /**
   * Handle changes to the mindmap code in the editor
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setError(null);
  };

  return {
    code,
    error,
    isGenerating,
    generateMindmap,
    handleCodeChange,
  };
};

export default useMindmapGenerator;
