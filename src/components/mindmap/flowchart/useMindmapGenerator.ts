import { useState } from "react";
import { generateMindmapFromPdf } from "@/services/geminiService";

// Default mindmap diagram with enhanced colors and branch-based structure
export const defaultMindmap = `mindmap
  root((Paper Topic)):::root
    Key Concept 1:::branch1
      Sub-concept 1.1:::subbranch1
      Sub-concept 1.2:::subbranch1
    Key Concept 2:::branch2
      Sub-concept 2.1:::subbranch2
      Sub-concept 2.2:::subbranch2
    Key Concept 3:::branch3
      Sub-concept 3.1:::subbranch3
        Detail 3.1.1:::detail3
        Detail 3.1.2:::detail3

%% Color styling for different branches
classDef root fill:#8b5cf6,color:#ffffff,stroke:#6d28d9,stroke-width:4px,font-size:18px
classDef branch1 fill:#f97316,color:#ffffff,stroke:#ea580c,stroke-width:2px
classDef branch2 fill:#06b6d4,color:#ffffff,stroke:#0891b2,stroke-width:2px
classDef branch3 fill:#10b981,color:#ffffff,stroke:#059669,stroke-width:2px
classDef subbranch1 fill:#fdba74,color:#7c2d12,stroke:#f97316
classDef subbranch2 fill:#67e8f9,color:#164e63,stroke:#06b6d4
classDef subbranch3 fill:#6ee7b7,color:#064e3b,stroke:#10b981
classDef detail3 fill:#d1fae5,color:#064e3b,stroke:#10b981,stroke-dasharray:2
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
        // Add color styling to the response based on branches
        const enhancedResponse = addColorStylingToMindmap(response);
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
   * Add color styling to mindmap code based on branch structure and content
   */
  const addColorStylingToMindmap = (mindmapCode: string): string => {
    // Check if the mindmap already has styling
    if (mindmapCode.includes('classDef')) {
      return mindmapCode;
    }

    // Split the mindmap code into lines
    const lines = mindmapCode.split('\n');
    const processedLines: string[] = [];
    const branchClasses: string[] = [];
    
    // Keywords to special colors based on content
    const keywordMapping: Record<string, string> = {
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

    lines.forEach(line => {
      // Calculate the indentation level
      const match = line.match(/^\s*/);
      const indent = match ? match[0].length : 0;
      const level = indent / 2; // Assuming 2 spaces per level

      // Root node
      if (line.includes('((') && line.includes('))')) {
        processedLines.push(`${line}:::root`);
        branchCounter = 0;
      } 
      // Main branches (indent level 1)
      else if (level === 1) {
        branchCounter++;
        const branchClass = `branch${branchCounter}`;
        branchClasses.push(branchClass);
        
        // Apply content-based classes if keywords are present
        const lowerCaseLine = line.toLowerCase();
        const contentClass = Object.keys(keywordMapping).find(key => lowerCaseLine.includes(key));
        
        if (contentClass) {
          processedLines.push(`${line}:::${keywordMapping[contentClass]}`);
        } else {
          processedLines.push(`${line}:::${branchClass}`);
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
        const className = level === 2 ? 
          `subbranch${parentBranch}` : 
          `detail${parentBranch}`;
        
        processedLines.push(`${line}:::${className}`);
        currentLevel = level;
      } 
      // Keep other lines as they are
      else {
        processedLines.push(line);
      }
    });

    // Add style definitions at the end of the mindmap
    processedLines.push('\n%% Color styling for different branches');
    processedLines.push('classDef root fill:#8b5cf6,color:#ffffff,stroke:#6d28d9,stroke-width:4px,font-size:18px');
    
    // Define branch colors - use a vibrant palette
    const branchColors = [
      { base: '#f97316', light: '#fdba74', dark: '#ea580c', text: '#7c2d12' }, // orange
      { base: '#06b6d4', light: '#67e8f9', dark: '#0891b2', text: '#164e63' }, // cyan
      { base: '#10b981', light: '#6ee7b7', dark: '#059669', text: '#064e3b' }, // emerald
      { base: '#8b5cf6', light: '#c4b5fd', dark: '#7c3aed', text: '#4c1d95' }, // violet
      { base: '#ec4899', light: '#f9a8d4', dark: '#db2777', text: '#831843' }, // pink
      { base: '#ef4444', light: '#fca5a5', dark: '#dc2626', text: '#7f1d1d' }, // red
      { base: '#f59e0b', light: '#fcd34d', dark: '#d97706', text: '#78350f' }, // amber
      { base: '#84cc16', light: '#bef264', dark: '#65a30d', text: '#3f6212' }, // lime
    ];

    // Add class definitions for each branch
    for (let i = 1; i <= branchCounter; i++) {
      const colorSet = branchColors[(i - 1) % branchColors.length];
      processedLines.push(`classDef branch${i} fill:${colorSet.base},color:#ffffff,stroke:${colorSet.dark},stroke-width:2px`);
      processedLines.push(`classDef subbranch${i} fill:${colorSet.light},color:${colorSet.text},stroke:${colorSet.base}`);
      processedLines.push(`classDef detail${i} fill:#ffffff,color:${colorSet.text},stroke:${colorSet.base},stroke-dasharray:2`);
    }
    
    // Add content-based styling
    processedLines.push('classDef intro fill:#f97316,color:#ffffff,stroke:#ea580c');
    processedLines.push('classDef background fill:#94a3b8,color:#ffffff,stroke:#64748b');
    processedLines.push('classDef method fill:#06b6d4,color:#ffffff,stroke:#0891b2');
    processedLines.push('classDef experiment fill:#2dd4bf,color:#ffffff,stroke:#14b8a6');
    processedLines.push('classDef result fill:#10b981,color:#ffffff,stroke:#059669');
    processedLines.push('classDef discussion fill:#8b5cf6,color:#ffffff,stroke:#7c3aed');
    processedLines.push('classDef conclusion fill:#6366f1,color:#ffffff,stroke:#4f46e5');
    processedLines.push('classDef reference fill:#64748b,color:#ffffff,stroke:#475569');
    processedLines.push('classDef limitation fill:#f43f5e,color:#ffffff,stroke:#e11d48');
    processedLines.push('classDef future fill:#8b5cf6,color:#ffffff,stroke:#7c3aed');
    processedLines.push('classDef theory fill:#f59e0b,color:#ffffff,stroke:#d97706');
    processedLines.push('classDef analysis fill:#06b6d4,color:#ffffff,stroke:#0891b2');
    processedLines.push('classDef synthesis fill:#10b981,color:#ffffff,stroke:#059669');
    processedLines.push('classDef evaluation fill:#8b5cf6,color:#ffffff,stroke:#7c3aed');

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
