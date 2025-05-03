
/**
 * Mind map utilities for validating and enhancing mind map data
 */

interface MindMapNode {
  id: string;
  topic: string;
  children?: MindMapNode[];
  direction?: 0 | 1;
  // Can include additional properties like style, expanded, etc.
}

interface MindMapData {
  nodeData: MindMapNode;
}

/**
 * Validates that a mind map has actual content from the PDF
 * @param mindMapData The mind map data to validate
 * @returns An object containing validation results
 */
export function validateMindMapContent(mindMapData: MindMapData): {
  isValid: boolean;
  hasActualContent: boolean;
  contentScore: number; // 0-100 rating how "content-rich" the mind map is
  genericTermCount: number;
  specificTermCount: number;
} {
  if (!mindMapData?.nodeData) {
    return {
      isValid: false,
      hasActualContent: false,
      contentScore: 0,
      genericTermCount: 0,
      specificTermCount: 0
    };
  }

  // Generic academic terms that might indicate placeholder content
  const genericTerms = [
    "introduction", "methodology", "methods", "results", "discussion", 
    "conclusion", "references", "appendix", "research", "paper",
    "study", "analysis", "findings", "data", "experimental", "literature review",
    "framework", "theory", "model", "approach", "background", "limitations",
    "future work", "contributions", "implications", "summary", "provides",
    "describes", "presents", "explores", "conducted", "section",
    "examines", "investigates", "analyzes", "addresses", "considers"
  ];

  // Count of generic vs specific terms
  let genericTermCount = 0;
  let specificTermCount = 0;
  let totalNodes = 0;

  // Function to analyze a node recursively
  const analyzeNode = (node: MindMapNode) => {
    totalNodes++;
    const nodeTopic = node.topic.toLowerCase();

    // Check for generic terms
    let isGeneric = false;
    for (const term of genericTerms) {
      if (nodeTopic.includes(term)) {
        genericTermCount++;
        isGeneric = true;
        break;
      }
    }

    // If not generic and has content, assume specific
    if (!isGeneric && nodeTopic.length > 4) {
      specificTermCount++;
    }

    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach(analyzeNode);
    }
  };

  // Start analysis from root node
  analyzeNode(mindMapData.nodeData);

  // Calculate content score (0-100)
  const contentScore = totalNodes === 0 ? 0 : 
    Math.min(100, Math.round((specificTermCount / totalNodes) * 100));

  // Determine if the mind map has actual content
  // Criteria: More specific terms than generic ones or high content score
  const hasActualContent = specificTermCount > genericTermCount || contentScore > 60;

  return {
    isValid: totalNodes > 3, // At least a few nodes
    hasActualContent,
    contentScore,
    genericTermCount,
    specificTermCount
  };
}

/**
 * Gets diagnostic information from a mind map for debugging
 */
export function getMindMapDiagnostics(mindMapData: MindMapData | null): string {
  if (!mindMapData) return "No mind map data available";
  
  try {
    const validation = validateMindMapContent(mindMapData);
    
    return `
Mind Map Diagnostic Report:
---------------------------
Root topic: "${mindMapData.nodeData.topic}"
Total top-level sections: ${mindMapData.nodeData.children?.length || 0}
Content validation score: ${validation.contentScore}/100
Contains actual content: ${validation.hasActualContent ? "Yes" : "No"}
Generic terms: ${validation.genericTermCount}
Specific terms: ${validation.specificTermCount}
---------------------------
    `;
  }
  catch (error) {
    return `Error analyzing mind map: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Log mind map diagnostics to console for debugging
 */
export function logMindMapDiagnostics(pdfKey: string | null): void {
  if (!pdfKey) {
    console.log("No PDF key provided for diagnostics");
    return;
  }
  
  try {
    const mindMapKey = `mindMapData_${pdfKey}`;
    const savedData = sessionStorage.getItem(mindMapKey);
    
    if (!savedData) {
      console.log(`No mind map data found with key: ${mindMapKey}`);
      return;
    }
    
    const parsedData = JSON.parse(savedData);
    console.log(getMindMapDiagnostics(parsedData));
  }
  catch (error) {
    console.error("Error logging mind map diagnostics:", error);
  }
}
