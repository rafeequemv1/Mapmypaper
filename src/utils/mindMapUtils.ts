
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
  emojiCount: number;
  maxDepth: number;
} {
  if (!mindMapData?.nodeData) {
    return {
      isValid: false,
      hasActualContent: false,
      contentScore: 0,
      genericTermCount: 0,
      specificTermCount: 0,
      emojiCount: 0,
      maxDepth: 0
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
  let emojiCount = 0;
  let maxDepth = 0;

  // Function to analyze a node recursively
  const analyzeNode = (node: MindMapNode, depth = 0) => {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);
    
    const nodeTopic = node.topic.toLowerCase();

    // Count emojis in the topic
    const emojiRegex = /[\p{Emoji}]/gu;
    const emojiMatches = node.topic.match(emojiRegex);
    if (emojiMatches) {
      emojiCount += emojiMatches.length;
    }

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
      node.children.forEach(child => analyzeNode(child, depth + 1));
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
    specificTermCount,
    emojiCount,
    maxDepth
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
Emoji count: ${validation.emojiCount}
Maximum depth: ${validation.maxDepth}
---------------------------
    `;
  }
  catch (error) {
    return `Error analyzing mind map: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Enhances mind map nodes with emojis based on their content
 * @param mindMapData The mind map data to enhance
 * @returns Enhanced mind map data with emojis
 */
export function enhanceMindMapWithEmojis(mindMapData: MindMapData): MindMapData {
  if (!mindMapData?.nodeData) return mindMapData;
  
  // Deep clone to avoid modifying original
  const enhancedData = JSON.parse(JSON.stringify(mindMapData)) as MindMapData;
  
  // Process nodes recursively
  const processNode = (node: MindMapNode) => {
    // Skip if already has emoji
    if (!/[\p{Emoji}]/gu.test(node.topic)) {
      node.topic = addTopicEmoji(node.topic);
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach(processNode);
    }
    
    return node;
  };
  
  // Start processing from root
  processNode(enhancedData.nodeData);
  
  return enhancedData;
}

/**
 * Adds an appropriate emoji to a topic based on its content
 */
function addTopicEmoji(topic: string): string {
  // If it already has an emoji, return as is
  if (/[\p{Emoji}]/gu.test(topic)) return topic;
  
  const lowerTopic = topic.toLowerCase();
  
  // Main sections
  if (lowerTopic.includes('introduction') || lowerTopic.includes('intro')) return '🔍 ' + topic;
  if (lowerTopic.includes('methodology') || lowerTopic.includes('method')) return '⚙️ ' + topic;
  if (lowerTopic.includes('results')) return '📊 ' + topic;
  if (lowerTopic.includes('discussion')) return '💭 ' + topic;
  if (lowerTopic.includes('conclusion')) return '🎯 ' + topic;
  if (lowerTopic.includes('references') || lowerTopic.includes('citation')) return '📚 ' + topic;
  if (lowerTopic.includes('supplementary') || lowerTopic.includes('additional')) return '📎 ' + topic;
  
  // Introduction subsections
  if (lowerTopic.includes('background') || lowerTopic.includes('context')) return '📘 ' + topic;
  if (lowerTopic.includes('motivation') || lowerTopic.includes('problem')) return '⚠️ ' + topic;
  if (lowerTopic.includes('gap') || lowerTopic.includes('missing')) return '🧩 ' + topic;
  if (lowerTopic.includes('objective') || lowerTopic.includes('hypothesis')) return '🎯 ' + topic;
  if (lowerTopic.includes('purpose') || lowerTopic.includes('aim')) return '🏹 ' + topic;
  
  // Methodology subsections
  if (lowerTopic.includes('experimental') || lowerTopic.includes('experiment')) return '🧪 ' + topic;
  if (lowerTopic.includes('data collection') || lowerTopic.includes('sampling')) return '📥 ' + topic;
  if (lowerTopic.includes('model') || lowerTopic.includes('modeling')) return '🔬 ' + topic;
  if (lowerTopic.includes('theory') || lowerTopic.includes('framework')) return '🧠 ' + topic;
  if (lowerTopic.includes('procedure') || lowerTopic.includes('protocol')) return '📋 ' + topic;
  if (lowerTopic.includes('algorithm') || lowerTopic.includes('computation')) return '⚙️ ' + topic;
  if (lowerTopic.includes('variable') || lowerTopic.includes('parameter')) return '🔢 ' + topic;
  if (lowerTopic.includes('participant') || lowerTopic.includes('subject')) return '👥 ' + topic;
  if (lowerTopic.includes('equipment') || lowerTopic.includes('apparatus')) return '🔧 ' + topic;
  if (lowerTopic.includes('design') || lowerTopic.includes('setup')) return '📐 ' + topic;
  
  // Results subsections
  if (lowerTopic.includes('key finding') || lowerTopic.includes('main result')) return '✨ ' + topic;
  if (lowerTopic.includes('figure') || lowerTopic.includes('chart')) return '📈 ' + topic;
  if (lowerTopic.includes('table') || lowerTopic.includes('data')) return '📊 ' + topic;
  if (lowerTopic.includes('visualization') || lowerTopic.includes('graph')) return '📉 ' + topic;
  if (lowerTopic.includes('statistical') || lowerTopic.includes('statistics')) return '📏 ' + topic;
  if (lowerTopic.includes('analysis') || lowerTopic.includes('measure')) return '🔍 ' + topic;
  if (lowerTopic.includes('observation') || lowerTopic.includes('observed')) return '👁️ ' + topic;
  if (lowerTopic.includes('outcome') || lowerTopic.includes('output')) return '🏆 ' + topic;
  if (lowerTopic.includes('metric') || lowerTopic.includes('score')) return '📏 ' + topic;
  if (lowerTopic.includes('accuracy') || lowerTopic.includes('precision')) return '🎯 ' + topic;
  
  // Discussion subsections
  if (lowerTopic.includes('interpretation') || lowerTopic.includes('meaning')) return '🔎 ' + topic;
  if (lowerTopic.includes('comparison') || lowerTopic.includes('contrast')) return '⚖️ ' + topic;
  if (lowerTopic.includes('previous work') || lowerTopic.includes('prior research')) return '🔄 ' + topic;
  if (lowerTopic.includes('implication') || lowerTopic.includes('impact')) return '💡 ' + topic;
  if (lowerTopic.includes('limitation') || lowerTopic.includes('constraint')) return '🛑 ' + topic;
  if (lowerTopic.includes('strength') || lowerTopic.includes('advantage')) return '💪 ' + topic;
  if (lowerTopic.includes('weakness') || lowerTopic.includes('disadvantage')) return '⚠️ ' + topic;
  if (lowerTopic.includes('challenge') || lowerTopic.includes('difficult')) return '🧗 ' + topic;
  
  // Conclusion subsections
  if (lowerTopic.includes('summary') || lowerTopic.includes('overview')) return '📋 ' + topic;
  if (lowerTopic.includes('contribution') || lowerTopic.includes('achievement')) return '✅ ' + topic;
  if (lowerTopic.includes('future work') || lowerTopic.includes('future direction')) return '🔮 ' + topic;
  if (lowerTopic.includes('recommendation') || lowerTopic.includes('suggest')) return '💭 ' + topic;
  if (lowerTopic.includes('final') || lowerTopic.includes('remark')) return '🏁 ' + topic;
  if (lowerTopic.includes('takeaway') || lowerTopic.includes('key point')) return '🔑 ' + topic;
  
  // References subsections
  if (lowerTopic.includes('key paper') || lowerTopic.includes('important work')) return '📄 ' + topic;
  if (lowerTopic.includes('cited') || lowerTopic.includes('reference')) return '📚 ' + topic;
  if (lowerTopic.includes('dataset') || lowerTopic.includes('corpus')) return '📊 ' + topic;
  if (lowerTopic.includes('tool') || lowerTopic.includes('software')) return '🛠️ ' + topic;
  
  // Supplementary subsections
  if (lowerTopic.includes('additional') || lowerTopic.includes('extra')) return '➕ ' + topic;
  if (lowerTopic.includes('experiment') || lowerTopic.includes('test')) return '🧮 ' + topic;
  if (lowerTopic.includes('appendix') || lowerTopic.includes('appendices')) return '📑 ' + topic;
  if (lowerTopic.includes('code') || lowerTopic.includes('implementation')) return '💻 ' + topic;
  if (lowerTopic.includes('data availability') || lowerTopic.includes('repository')) return '💾 ' + topic;
  
  // Research methods & techniques
  if (lowerTopic.includes('survey') || lowerTopic.includes('questionnaire')) return '📝 ' + topic;
  if (lowerTopic.includes('interview') || lowerTopic.includes('focus group')) return '🎤 ' + topic;
  if (lowerTopic.includes('observation') || lowerTopic.includes('ethnography')) return '👁️ ' + topic;
  if (lowerTopic.includes('experiment') || lowerTopic.includes('trial')) return '🧪 ' + topic;
  if (lowerTopic.includes('simulation') || lowerTopic.includes('modeling')) return '🖥️ ' + topic;
  if (lowerTopic.includes('case study') || lowerTopic.includes('sample')) return '🔍 ' + topic;
  if (lowerTopic.includes('review') || lowerTopic.includes('meta-analysis')) return '📖 ' + topic;
  
  // Data analysis techniques
  if (lowerTopic.includes('regression') || lowerTopic.includes('correlation')) return '📉 ' + topic;
  if (lowerTopic.includes('classification') || lowerTopic.includes('clustering')) return '🔠 ' + topic;
  if (lowerTopic.includes('neural network') || lowerTopic.includes('deep learning')) return '🧠 ' + topic;
  if (lowerTopic.includes('machine learning') || lowerTopic.includes('algorithm')) return '🤖 ' + topic;
  if (lowerTopic.includes('statistics') || lowerTopic.includes('probability')) return '📊 ' + topic;
  if (lowerTopic.includes('nlp') || lowerTopic.includes('natural language')) return '💬 ' + topic;
  if (lowerTopic.includes('computer vision') || lowerTopic.includes('image')) return '👁️ ' + topic;
  
  // Domain-specific topics
  if (lowerTopic.includes('medicine') || lowerTopic.includes('health')) return '🏥 ' + topic;
  if (lowerTopic.includes('biology') || lowerTopic.includes('gene')) return '🧬 ' + topic;
  if (lowerTopic.includes('physics') || lowerTopic.includes('quantum')) return '⚛️ ' + topic;
  if (lowerTopic.includes('chemistry') || lowerTopic.includes('molecule')) return '🧪 ' + topic;
  if (lowerTopic.includes('astronomy') || lowerTopic.includes('space')) return '🌌 ' + topic;
  if (lowerTopic.includes('earth') || lowerTopic.includes('climate')) return '🌍 ' + topic;
  if (lowerTopic.includes('psychology') || lowerTopic.includes('behavior')) return '🧠 ' + topic;
  if (lowerTopic.includes('sociology') || lowerTopic.includes('society')) return '👥 ' + topic;
  if (lowerTopic.includes('economics') || lowerTopic.includes('finance')) return '💰 ' + topic;
  if (lowerTopic.includes('business') || lowerTopic.includes('management')) return '💼 ' + topic;
  if (lowerTopic.includes('education') || lowerTopic.includes('learning')) return '🎓 ' + topic;
  if (lowerTopic.includes('history') || lowerTopic.includes('ancient')) return '🏺 ' + topic;
  if (lowerTopic.includes('literature') || lowerTopic.includes('poetry')) return '📚 ' + topic;
  if (lowerTopic.includes('art') || lowerTopic.includes('design')) return '🎨 ' + topic;
  if (lowerTopic.includes('music') || lowerTopic.includes('sound')) return '🎵 ' + topic;
  if (lowerTopic.includes('film') || lowerTopic.includes('movie')) return '🎬 ' + topic;
  if (lowerTopic.includes('technology') || lowerTopic.includes('innovation')) return '💻 ' + topic;
  if (lowerTopic.includes('engineering') || lowerTopic.includes('mechanical')) return '⚙️ ' + topic;
  if (lowerTopic.includes('software') || lowerTopic.includes('programming')) return '👨‍💻 ' + topic;
  if (lowerTopic.includes('ethics') || lowerTopic.includes('moral')) return '⚖️ ' + topic;
  if (lowerTopic.includes('policy') || lowerTopic.includes('regulation')) return '📜 ' + topic;
  if (lowerTopic.includes('sustainability') || lowerTopic.includes('environment')) return '♻️ ' + topic;
  
  // Generic topics (fallbacks)
  if (lowerTopic.includes('start') || lowerTopic.includes('begin')) return '🚀 ' + topic;
  if (lowerTopic.includes('key') || lowerTopic.includes('important')) return '🔑 ' + topic;
  if (lowerTopic.includes('question') || lowerTopic.includes('query')) return '❓ ' + topic;
  if (lowerTopic.includes('answer') || lowerTopic.includes('solution')) return '✅ ' + topic;
  if (lowerTopic.includes('problem') || lowerTopic.includes('issue')) return '⚠️ ' + topic;
  if (lowerTopic.includes('idea') || lowerTopic.includes('concept')) return '💡 ' + topic;
  if (lowerTopic.includes('time') || lowerTopic.includes('duration')) return '⏱️ ' + topic;
  if (lowerTopic.includes('goal') || lowerTopic.includes('target')) return '🎯 ' + topic;
  
  // Default emoji for unmatched topics - use a variety
  const defaultEmojis = ['📌', '🔹', '💠', '🔸', '✨', '🔆', '📍', '🔶', '🔷', '💫'];
  const hash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const emojiIndex = hash % defaultEmojis.length;
  
  return defaultEmojis[emojiIndex] + ' ' + topic;
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

