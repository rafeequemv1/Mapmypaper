// Utility functions for enhancing and validating mind maps

export interface MindMapValidationResult {
  nodeCount: number;
  emojiCount: number;
  specificTermCount: number;
  quality: 'low' | 'medium' | 'high';
}

/**
 * Validates the content richness of a mind map
 * @param mindMapData The mind map data to validate
 * @returns Validation metrics
 */
export const validateMindMapContent = (mindMapData: any): MindMapValidationResult => {
  let nodeCount = 0;
  let emojiCount = 0;
  let specificTermCount = 0;
  
  // Function to recursively analyze nodes
  const analyzeNode = (node: any) => {
    if (!node) return;
    
    nodeCount++;
    
    // Check if the node topic has an emoji
    if (node.topic && /\p{Emoji}/u.test(node.topic)) {
      emojiCount++;
    }
    
    // Check for specific academic/research terms
    const specificTerms = [
      'research', 'study', 'analysis', 'method', 'result', 'finding',
      'conclusion', 'introduction', 'literature', 'framework', 'theory',
      'experiment', 'data', 'sample', 'hypothesis', 'variable', 'correlation',
      'significance', 'limitation', 'implication', 'recommendation'
    ];
    
    if (node.topic) {
      const topicLower = node.topic.toLowerCase();
      for (const term of specificTerms) {
        if (topicLower.includes(term)) {
          specificTermCount++;
          break; // Only count once per node
        }
      }
    }
    
    // Process children nodes
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(analyzeNode);
    }
  };
  
  // Start analysis with the root node
  if (mindMapData && mindMapData.nodeData) {
    analyzeNode(mindMapData.nodeData);
  }
  
  // Determine quality based on metrics
  let quality: 'low' | 'medium' | 'high' = 'low';
  const emojiRatio = nodeCount > 0 ? emojiCount / nodeCount : 0;
  const specificRatio = nodeCount > 0 ? specificTermCount / nodeCount : 0;
  
  if (emojiRatio >= 0.7 && specificRatio >= 0.5) {
    quality = 'high';
  } else if (emojiRatio >= 0.4 && specificRatio >= 0.3) {
    quality = 'medium';
  }
  
  return {
    nodeCount,
    emojiCount,
    specificTermCount,
    quality
  };
};

/**
 * Add missing emojis to nodes based on their content
 * @param mindMapData The mind map data to enhance
 * @returns Enhanced mind map data with more emojis
 */
export const enhanceMindMapWithEmojis = (mindMapData: any): any => {
  // Function to add emoji based on node content
  const addEmojiToNode = (node: any): void => {
    if (!node) return;
    
    // Skip if node already has an emoji
    if (node.topic && /^\p{Emoji}/u.test(node.topic)) {
      // Node already has an emoji, keep it
    } else if (node.topic) {
      // Add an emoji based on content
      const topicLower = node.topic.toLowerCase();
      
      // Main sections
      if (topicLower.includes('introduction')) node.topic = '🔍 ' + node.topic;
      else if (topicLower.includes('methodology')) node.topic = '⚙️ ' + node.topic;
      else if (topicLower.includes('results')) node.topic = '📊 ' + node.topic;
      else if (topicLower.includes('discussion')) node.topic = '💭 ' + node.topic;
      else if (topicLower.includes('conclusion')) node.topic = '🎯 ' + node.topic;
      else if (topicLower.includes('references')) node.topic = '📚 ' + node.topic;
      else if (topicLower.includes('supplementary')) node.topic = '📎 ' + node.topic;
      
      // Process subsections
      else if (topicLower.includes('background')) node.topic = '📘 ' + node.topic;
      else if (topicLower.includes('problem')) node.topic = '⚠️ ' + node.topic;
      else if (topicLower.includes('experiment')) node.topic = '🧪 ' + node.topic;
      else if (topicLower.includes('finding')) node.topic = '✨ ' + node.topic;
      else if (topicLower.includes('analysis')) node.topic = '📏 ' + node.topic;
      else if (topicLower.includes('limitation')) node.topic = '🛑 ' + node.topic;
      else if (topicLower.includes('future')) node.topic = '🔮 ' + node.topic;
      else if (topicLower.includes('data')) node.topic = '💾 ' + node.topic;
      else if (topicLower.includes('method')) node.topic = '🔬 ' + node.topic;
      else {
        // Default emoji for generic content
        node.topic = '📌 ' + node.topic;
      }
    }
    
    // Process children nodes
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(addEmojiToNode);
    }
  };
  
  // Create a deep copy to avoid mutating the original
  const enhancedData = JSON.parse(JSON.stringify(mindMapData));
  
  // Start enhancement with the root node
  if (enhancedData && enhancedData.nodeData) {
    addEmojiToNode(enhancedData.nodeData);
  }
  
  return enhancedData;
};
