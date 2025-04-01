import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";
import { DetailLevel } from "../MindmapModal";

// Default mindmap diagram with enhanced colors and branch-based structure
// Updated to show more detailed sub-branches by default
export const defaultMindmap = `mindmap
  root((Paper Topic))
    Summary:::summary
      Key Points:::summaryDetail
        Point 1:::detailPoint
        Point 2:::detailPoint
        Point 3:::detailPoint
      Main Contributions:::summaryDetail
        Contribution 1:::detailPoint
        Contribution 2:::detailPoint
      Significance:::summaryDetail
        Academic Impact:::detailPoint
        Practical Applications:::detailPoint
    Key Concept 1:::branch1
      Sub-concept 1.1:::subbranch1
        Detail 1.1.1:::detail1
          Sub-detail 1.1.1.1:::subdetail1
          Sub-detail 1.1.1.2:::subdetail1
        Detail 1.1.2:::detail1
          Sub-detail 1.1.2.1:::subdetail1
      Sub-concept 1.2:::subbranch1
        Detail 1.2.1:::detail1
          Supporting Evidence:::subdetail1
        Detail 1.2.2:::detail1
          Counter Arguments:::subdetail1
    Key Concept 2:::branch2
      Sub-concept 2.1:::subbranch2
        Detail 2.1.1:::detail2
          Experiments:::subdetail2
          Results:::subdetail2
        Detail 2.1.2:::detail2
          Analysis:::subdetail2
      Sub-concept 2.2:::subbranch2
        Detail 2.2.1:::detail2
          Methods:::subdetail2
        Detail 2.2.2:::detail2
          Findings:::subdetail2
    Key Concept 3:::branch3
      Sub-concept 3.1:::subbranch3
        Detail 3.1.1:::detail3
          Data Collection:::subdetail3
          Processing:::subdetail3
        Detail 3.1.2:::detail3
          Interpretation:::subdetail3
          Sub-detail 3.1.2.1:::subdetail3
            Implications:::subsubdetail3
            Limitations:::subsubdetail3

%% Color styling for different branches
classDef root fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px
classDef summary fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold
classDef summaryDetail fill:#333333,color:#ffffff,stroke:#000000,font-style:italic
classDef detailPoint fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:1
classDef branch1 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef branch2 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef branch3 fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px
classDef subbranch1 fill:#333333,color:#ffffff,stroke:#000000
classDef subbranch2 fill:#333333,color:#ffffff,stroke:#000000
classDef subbranch3 fill:#333333,color:#ffffff,stroke:#000000
classDef detail1 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef detail2 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef detail3 fill:#555555,color:#ffffff,stroke:#000000,stroke-dasharray:2
classDef subdetail1 fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
classDef subdetail2 fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
classDef subdetail3 fill:#777777,color:#ffffff,stroke:#000000,stroke-dasharray:3
classDef subsubdetail3 fill:#999999,color:#ffffff,stroke:#000000,stroke-dasharray:4
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
  const generateMindmap = async (detailLevel: DetailLevel = 'detailed') => {
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
        // Apply detail level processing
        const processedResponse = processDetailLevel(enhancedResponse, detailLevel);
        setCode(processedResponse);
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
   * Process mindmap based on selected detail level
   */
  const processDetailLevel = (mindmapCode: string, detailLevel: DetailLevel): string => {
    // Split the code into lines for processing
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    
    // Filter based on detail level
    let maxDepth: number;
    
    switch (detailLevel) {
      case 'simple':
        maxDepth = 3; // Root + main branches + first level sub-branches
        break;
      case 'detailed':
        maxDepth = 5; // Root + main branches + sub-branches + details
        break;
      case 'advanced':
        maxDepth = 10; // Include all levels of detail
        break;
      default:
        maxDepth = 5; // Default to detailed
    }
    
    // Process each line
    let skipSection = false;
    let currentDepth = 0;
    let previousDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines or class definitions
      if (!line.trim() || line.trim().startsWith('classDef') || line.trim().startsWith('%%')) {
        processedLines.push(line);
        continue;
      }
      
      // Check if it's the mindmap declaration
      if (line.trim() === 'mindmap') {
        processedLines.push(line);
        continue;
      }
      
      // Calculate indentation level
      const match = line.match(/^(\s*)/);
      const indent = match ? match[0].length : 0;
      currentDepth = indent / 2; // Assuming 2 spaces per level
      
      // Check if we need to skip this section based on depth
      if (currentDepth > maxDepth) {
        skipSection = true;
        continue;
      } else {
        skipSection = false;
      }
      
      // If this line is within our depth limit or it's a class identifier, keep it
      if (!skipSection) {
        processedLines.push(line);
        
        // If we're moving to a more detailed level and detailLevel is 'detailed' or 'advanced',
        // ensure we add some subdetails
        if (detailLevel !== 'simple' && 
            currentDepth > previousDepth && 
            currentDepth === maxDepth - 1 && 
            i < lines.length - 1) {
          
          // Check if the next line would be deeper (meaning there are already details)
          const nextMatch = lines[i + 1].match(/^(\s*)/);
          const nextIndent = nextMatch ? nextMatch[0].length : 0;
          const nextDepth = nextIndent / 2;
          
          // If next line isn't deeper, add automatic details
          if (nextDepth <= currentDepth) {
            // Extract the node content for contextualized details
            const nodeParts = line.split(':::');
            const nodeContent = nodeParts[0].trim();
            
            // Add automatic detail points
            if (detailLevel === 'detailed') {
              // For detailed, add 2 detail points
              const detailsToAdd = generateDetailPointsForNode(nodeContent, 2);
              const nextIndent = ' '.repeat((currentDepth + 1) * 2);
              
              for (const detail of detailsToAdd) {
                processedLines.push(`${nextIndent}${detail}`);
              }
            } else if (detailLevel === 'advanced') {
              // For advanced, add more details with sub-details
              const detailsToAdd = generateDetailPointsForNode(nodeContent, 3);
              const nextIndent = ' '.repeat((currentDepth + 1) * 2);
              
              for (let j = 0; j < detailsToAdd.length; j++) {
                processedLines.push(`${nextIndent}${detailsToAdd[j]}`);
                
                // Add sub-details for the first detail point
                if (j === 0) {
                  const subDetailsToAdd = generateDetailPointsForNode(detailsToAdd[j], 2);
                  const subDetailIndent = ' '.repeat((currentDepth + 2) * 2);
                  
                  for (const subDetail of subDetailsToAdd) {
                    processedLines.push(`${subDetailIndent}${subDetail}`);
                  }
                }
              }
            }
          }
        }
      }
      
      previousDepth = currentDepth;
    }
    
    // Make sure we have the style definitions
    if (!processedLines.some(line => line.includes('classDef'))) {
      processedLines.push('\n%% Color styling for different branches - monochrome theme');
      processedLines.push('classDef root fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-size:18px');
      processedLines.push('classDef summary fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px,font-weight:bold');
      processedLines.push('classDef summaryDetail fill:#333333,color:#ffffff,stroke:#000000,font-style:italic');
      
      // Define branch colors - black/gray monochrome theme
      for (let i = 1; i <= Math.max(3, 3); i++) {
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
    
    // If we're using 'simple' mode, we may need to adjust the styling
    if (detailLevel === 'simple') {
      // Add some simplified class definitions if needed
      processedLines.push('classDef simple fill:#000000,color:#ffffff,stroke:#000000,stroke-width:2px');
    }
    
    return processedLines.join('\n');
  };
  
  /**
   * Generate detail points for a node based on its content
   */
  const generateDetailPointsForNode = (nodeContent: string, count: number): string[] => {
    const details: string[] = [];
    const baseTemplates = [
      'Supporting evidence:::detail',
      'Critical analysis:::detail',
      'Limitations:::detail',
      'Applications:::detail',
      'Methods:::detail',
      'Results:::detail',
      'Future directions:::detail',
      'Key insights:::detail'
    ];
    
    // Extract keywords if possible
    const keywords = extractKeywords(nodeContent);
    
    if (keywords.length > 0) {
      // Use keywords to generate detail points
      for (let i = 0; i < count; i++) {
        if (i < keywords.length) {
          const detailText = `${keywords[i]} analysis:::detail${i % 3 + 1}`;
          details.push(detailText);
        } else {
          details.push(baseTemplates[i % baseTemplates.length]);
        }
      }
    } else {
      // Use base templates
      for (let i = 0; i < count; i++) {
        details.push(baseTemplates[i % baseTemplates.length]);
      }
    }
    
    return details;
  };
  
  /**
   * Extract meaningful keywords from node content
   */
  const extractKeywords = (content: string): string[] => {
    // Remove emojis and punctuation
    const cleanContent = content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]\s?/g, '')
      .replace(/[.,;:!?()]/g, '');
      
    // Split into words and filter out common words
    const words = cleanContent.split(' ').filter(word => 
      word.length > 3 && !['and', 'the', 'this', 'that', 'with', 'from'].includes(word.toLowerCase()));
    
    return words;
  };
  
  /**
   * Generate meaningful detail points based on keywords
   */
  const generateDetailPoints = (keywords: string[]): string[] => {
    if (keywords.length === 0) {
      return ['Supporting evidence', 'Critical analysis', 'Practical implications'];
    }
    
    const details: string[] = [];
    const templates = [
      'Evidence for {{keyword}}',
      'Analysis of {{keyword}}',
      'Implications of {{keyword}}',
      'Methodology for {{keyword}}',
      '{{keyword}} framework',
      '{{keyword}} limitations',
      'Future work on {{keyword}}',
      '{{keyword}} applications',
      'Experimental {{keyword}}',
      'Theoretical {{keyword}}'
    ];
    
    // Use keywords to generate 2-3 detail points
    const numDetails = Math.min(Math.floor(Math.random() * 2) + 2, keywords.length * 2);
    for (let i = 0; i < numDetails; i++) {
      const keyword = keywords[i % keywords.length];
      const template = templates[Math.floor(Math.random() * templates.length)];
      details.push(template.replace('{{keyword}}', keyword));
    }
    
    return details;
  };

  /**
   * Ensure that mindmap has detailed sub-branches by expanding any leaf nodes
   */
  const ensureDetailedSubbranches = (mindmapCode: string): string => {
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    const expandedLeafNodes: Map<number, boolean> = new Map();
    
    // Process lines to identify and expand leaf nodes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines, class definitions, etc.
      if (!line || line.startsWith('mindmap') || line.startsWith('classDef') || line.startsWith('%%')) {
        processedLines.push(lines[i]);
        continue;
      }
      
      // Calculate indentation level
      const match = lines[i].match(/^(\s*)/);
      const currentIndent = match ? match[0].length : 0;
      const level = currentIndent / 2; // Assuming 2 spaces per level
      
      // Check if this is a potential leaf node (no children in next lines)
      let isLeafNode = false;
      
      if (i < lines.length - 1) {
        const nextMatch = lines[i + 1].match(/^(\s*)/);
        const nextIndent = nextMatch ? nextMatch[0].length : 0;
        
        // If next line has same or less indentation, this is a leaf node
        if (nextIndent <= currentIndent) {
          isLeafNode = true;
        }
      } else {
        // Last line is always a leaf node
        isLeafNode = true;
      }
      
      // Process leaf nodes if they're not class definitions or comments
      if (isLeafNode && !line.startsWith('classDef') && !line.startsWith('%%') && level >= 2 && level < 4 && !expandedLeafNodes.get(i)) {
        // Extract node information for expansion
        const nodeParts = line.split(':::');
        const nodeContent = nodeParts[0].trim();
        const nodeClass = nodeParts.length > 1 ? nodeParts[1].trim() : '';
        
        // Add the original line
        processedLines.push(lines[i]);
        
        // Generate detail points for this node
        const detailClass = `subdetail${level}`;
        const indent = ' '.repeat((level + 1) * 2);
        
        // Extract keywords from node content for meaningful details
        const keywords = extractKeywords(nodeContent);
        
        // Add 2-3 detail points
        const details = generateDetailPoints(keywords);
        for (let j = 0; j < details.length; j++) {
          processedLines.push(`${indent}${details[j]}:::${detailClass}`);
        }
        
        // Mark as expanded
        expandedLeafNodes.set(i, true);
      } else {
        // Keep the original line
        processedLines.push(lines[i]);
      }
    }
    
    // Add class definitions for potential new levels if not already present
    if (!mindmapCode.includes('classDef subsubdetail')) {
      processedLines.push('classDef subsubdetail1 fill:#999999,color:#ffffff,stroke:#000000,stroke-dasharray:4');
      processedLines.push('classDef subsubdetail2 fill:#999999,color:#ffffff,stroke:#000000,stroke-dasharray:4');
      processedLines.push('classDef subsubdetail3 fill:#999999,color:#ffffff,stroke:#000000,stroke-dasharray:4');
    }
    
    return processedLines.join('\n');
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

  return {
    code,
    error,
    isGenerating,
    generateMindmap
  };
};

export default useMindmapGenerator;
