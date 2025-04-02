import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Default mindmap diagram with enhanced colors and branch-based structure with emojis
export const defaultMindmap = `mindmap
  root((📑 Paper Topic))
  class root rootStyle
  
  root --> summary["🔍 Summary"]
  class summary summaryClass
  
  summary --> keyPoints["✨ Key Points"]
  class keyPoints summaryDetailClass
  
  summary --> mainContrib["⭐ Main Contributions"]
  class mainContrib summaryDetailClass
  
  summary --> significance["💎 Significance"]
  class significance summaryDetailClass
  
  root --> methodology["⚙️ Methodology"]
  class methodology branch1Class
  
  methodology --> approach["🧪 Approach"]
  class approach subbranch1Class
  
  approach --> design["🔧 Design"]
  class design detail1Class
  
  approach --> implementation["⚡ Implementation"]
  class implementation detail1Class
  
  methodology --> datasets["📊 Datasets"]
  class datasets subbranch1Class
  
  datasets --> preparation["🔄 Data Preparation"]
  class preparation detail1Class
  
  root --> results["📈 Results"]
  class results branch2Class
  
  results --> findings["🎯 Key Findings"]
  class findings subbranch2Class
  
  findings --> performance["⚡ Performance"]
  class performance detail2Class
  
  findings --> comparison["🔍 Comparison"]
  class comparison detail2Class
  
  results --> analysis["📏 Analysis"]
  class analysis subbranch2Class
  
  root --> discussion["💭 Discussion"]
  class discussion branch3Class
  
  discussion --> implications["💡 Implications"]
  class implications subbranch3Class
  
  implications --> theory["📚 Theory"]
  class theory detail3Class
  
  implications --> practice["⚒️ Practice"]
  class practice detail3Class
  
  discussion --> limitations["🛑 Limitations"]
  class limitations subbranch3Class
  
  limitations --> future["🔮 Future Work"]
  class future detail3Class

%% Color styling for different branches
%% classDef rootStyle fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px
%% classDef summaryClass fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold
%% classDef summaryDetailClass fill:#333333,color:#ffffff,stroke:#000000,font-style:italic
%% classDef branch1Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef branch2Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef branch3Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
%% classDef subbranch1Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef subbranch2Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef subbranch3Class fill:#333333,color:#ffffff,stroke:#000000
%% classDef detail1Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef detail2Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef detail3Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
%% classDef subdetail3Class fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
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
        // Ensure we have enough emojis in the response
        const withEmojis = addEmojisToMindmap(enhancedResponse);
        setCode(withEmojis);
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
   * Add emojis to mindmap nodes that don't have them
   */
  const addEmojisToMindmap = (mindmapCode: string): string => {
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    
    // Map of keywords to emojis
    const emojiMap: Record<string, string> = {
      'summary': '🔍',
      'introduction': '🚪',
      'background': '📘',
      'method': '⚙️',
      'methodology': '⚙️',
      'approach': '🧪',
      'experiment': '🧪',
      'data': '📊',
      'dataset': '📊',
      'result': '📈',
      'finding': '✨',
      'performance': '⚡',
      'discussion': '💭',
      'implication': '💡',
      'limitation': '🛑',
      'future': '🔮',
      'conclusion': '🏁',
      'reference': '📚',
      'key point': '✨',
      'contribution': '⭐',
      'significance': '💎',
      'design': '🔧',
      'implementation': '⚡',
      'preparation': '🔄',
      'comparison': '🔍',
      'analysis': '📏',
      'theory': '📚',
      'practice': '⚒️',
      'objective': '🎯',
      'hypothesis': '🎯',
      'evaluation': '🔬',
      'research': '🔍',
      'question': '❓',
      'algorithm': '⚙️',
      'parameter': '🔢',
      'model': '🧠',
      'framework': '📐',
      'tool': '🛠️',
      'technique': '⚒️',
      'system': '🔄',
      'component': '🧩',
      'process': '⚙️',
      'step': '👣',
      'topic': '📑',
      'paper': '📄',
      'study': '🔬',
      'test': '🧪',
      'observation': '👁️',
      'idea': '💡',
      'challenge': '⚠️',
      'problem': '⚠️',
      'solution': '🔧',
      'goal': '🎯',
      'measure': '📏',
      'metric': '📊'
    };

    // Process each line
    lines.forEach(line => {
      // Skip empty lines or lines without node definitions
      if (!line.trim() || !line.includes('[') || line.startsWith('%%') || line.startsWith('class')) {
        processedLines.push(line);
        return;
      }
      
      // Check if already has emoji
      if (/\["[^"]*\p{Emoji}[^"]*"\]/u.test(line)) {
        processedLines.push(line);
        return;
      }
      
      // Extract node text
      const nodeTextMatch = line.match(/\["([^"]*)"\]/);
      if (!nodeTextMatch) {
        processedLines.push(line);
        return;
      }
      
      const nodeText = nodeTextMatch[1];
      const lowerText = nodeText.toLowerCase();
      
      // Find matching emoji
      let emoji = '';
      for (const [keyword, emojiChar] of Object.entries(emojiMap)) {
        if (lowerText.includes(keyword)) {
          emoji = emojiChar + ' ';
          break;
        }
      }
      
      // If no specific emoji found, use a default based on position in mindmap
      if (!emoji) {
        emoji = '📌 '; // Default emoji
      }
      
      // Replace node text with emoji + text
      const newLine = line.replace(/\["([^"]*)"\]/, `["${emoji}${nodeText}"]`);
      processedLines.push(newLine);
    });

    return processedLines.join('\n');
  };

  /**
   * Fix mindmap syntax to ensure there's only one root node
   * and use the updated class syntax for Mermaid
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
        
        // Extract root node ID and text
        const rootMatch = line.match(/\s*(\w+)\s*\(\((.*?)\)\)/);
        if (rootMatch) {
          const rootId = rootMatch[1];
          const rootText = rootMatch[2];
          
          // Add root node and its class separately
          processedLines.push(`  ${rootId}(("${rootText}"))`);
          processedLines.push(`  class ${rootId} rootStyle`);
        } else {
          // Fallback if regex fails
          processedLines.push(line);
        }
      } 
      // Handle another root node or potential root
      else if (line.includes('((') && line.includes('))') && foundRoot) {
        // Convert to a regular node
        const convertedLine = line.replace(/\(\(([^)]*)\)\)/, '["$1"]');
        processedLines.push(convertedLine);
      }
      // Handle nodes with the old :::class syntax
      else if (line.includes(':::')) {
        const [nodePart, classPart] = line.split(':::');
        
        // Extract node ID for class assignment
        const nodeIdMatch = nodePart.match(/\s*(\w+)\s*[\[\(\{"']/);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          processedLines.push(nodePart.trim());
          processedLines.push(`${' '.repeat(currentIndent)}class ${nodeId} ${classPart.trim()}`);
        } else {
          // Fallback if regex fails
          processedLines.push(line);
        }
      }
      // Handle regular nodes
      else {
        processedLines.push(line);
      }
    }
    
    // If no root was found, add one at the beginning
    if (!foundRoot) {
      processedLines.splice(1, 0, "  root((📑 Paper Topic))");
      processedLines.splice(2, 0, "  class root rootStyle");
    }
    
    return processedLines.join('\n');
  };

  /**
   * Add color styling to mindmap code based on branch structure and content
   * Using the new class syntax instead of ::: for compatibility
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

    // Split the mindmap code into lines
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    const nodeClasses: Map<string, string> = new Map();
    
    // Keywords to special colors based on content
    const keywordMapping: Record<string, string> = {
      summary: 'summaryClass',
      introduction: 'introClass',
      background: 'backgroundClass',
      method: 'methodClass',
      experiment: 'experimentClass',
      result: 'resultClass',
      discussion: 'discussionClass', 
      conclusion: 'conclusionClass',
      reference: 'referenceClass',
      limitation: 'limitationClass',
      future: 'futureClass',
      theory: 'theoryClass',
      analysis: 'analysisClass',
      synthesis: 'synthesisClass',
      evaluation: 'evaluationClass',
    };

    // Process each line to handle nodes and add class assignments
    let branchCounter = 0;
    let inHeader = true;
    let foundRoot = false;
    
    // First pass - process nodes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        processedLines.push('');
        continue;
      }
      
      // If we're at a class definition or after, just add as is
      if (line.startsWith('class ') || line.startsWith('classDef') || line.startsWith('%%')) {
        processedLines.push(line);
        continue;
      }
      
      // Root node (mindmap declaration)
      if (line === 'mindmap') {
        processedLines.push(line);
        continue;
      }
      
      // Root node
      if (line.includes('((') && line.includes('))') && !foundRoot) {
        foundRoot = true;
        
        // Extract root node ID and text
        const rootMatch = line.match(/\s*(\w+)\s*\(\((.*?)\)\)/);
        if (rootMatch) {
          const rootId = rootMatch[1];
          processedLines.push(line);
          processedLines.push(`class ${rootId} rootStyle`);
          nodeClasses.set(rootId, 'rootStyle');
        } else {
          // Fallback
          processedLines.push(line);
        }
      }
      // Handle connections (arrow syntax)
      else if (line.includes('-->')) {
        processedLines.push(line);
        
        // Extract source and target node IDs
        const arrowMatch = line.match(/(\w+)\s*-->\s*(\w+)/);
        if (arrowMatch) {
          const sourceId = arrowMatch[1];
          const targetId = arrowMatch[2];
          
          // If root is the source, assign branch class to target
          if (sourceId === 'root') {
            branchCounter++;
            const branchClass = `branch${branchCounter}Class`;
            
            // Search for content-based class first
            const lowerCaseLine = line.toLowerCase();
            const contentClass = Object.keys(keywordMapping).find(key => lowerCaseLine.includes(key));
            
            if (contentClass) {
              nodeClasses.set(targetId, keywordMapping[contentClass]);
            } else {
              nodeClasses.set(targetId, branchClass);
            }
          }
          // Assign classes based on parent's class
          else if (nodeClasses.has(sourceId)) {
            const parentClass = nodeClasses.get(sourceId);
            if (parentClass?.startsWith('branch')) {
              nodeClasses.set(targetId, parentClass.replace('branch', 'subbranch'));
            } else if (parentClass?.startsWith('subbranch')) {
              const branchNum = parentClass.match(/subbranch(\d+)Class/)?.[1] || '1';
              nodeClasses.set(targetId, `detail${branchNum}Class`);
            } else if (parentClass?.startsWith('detail')) {
              const branchNum = parentClass.match(/detail(\d+)Class/)?.[1] || '1';
              nodeClasses.set(targetId, `subdetail${branchNum}Class`);
            }
          }
        }
      }
      // Handle other lines
      else {
        processedLines.push(line);
      }
    }
    
    // Second pass - add class assignments
    for (const [nodeId, className] of nodeClasses.entries()) {
      if (!processedLines.some(line => line.trim() === `class ${nodeId} ${className}`)) {
        processedLines.push(`class ${nodeId} ${className}`);
      }
    }

    // Add style definitions at the end of the mindmap if they don't exist
    if (!processedLines.some(line => line.startsWith('classDef'))) {
      processedLines.push('\n%% Color styling for different branches - monochrome theme');
      processedLines.push('%% classDef rootStyle fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px');
      processedLines.push('%% classDef summaryClass fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold');
      processedLines.push('%% classDef summaryDetailClass fill:#333333,color:#ffffff,stroke:#000000,font-style:italic');
      
      // Define branch colors - black/gray monochrome theme
      for (let i = 1; i <= Math.max(branchCounter, 3); i++) {
        processedLines.push(`%% classDef branch${i}Class fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px`);
        processedLines.push(`%% classDef subbranch${i}Class fill:#333333,color:#ffffff,stroke:#000000`);
        processedLines.push(`%% classDef detail${i}Class fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2`);
        processedLines.push(`%% classDef subdetail${i}Class fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3`);
      }
      
      // Add content-based styling in monochrome
      processedLines.push('%% classDef introClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef backgroundClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef methodClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef experimentClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef resultClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef discussionClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef conclusionClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef referenceClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef limitationClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef futureClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef theoryClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef analysisClass fill:#111111,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef synthesisClass fill:#000000,color:#ffffff,stroke:#000000');
      processedLines.push('%% classDef evaluationClass fill:#111111,color:#ffffff,stroke:#000000');
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
