
/**
 * Extension for Mind Elixir to add image support
 * This utility file provides functions to add images to mind map nodes
 */
import { MindElixirInstance, NodeObj } from "mind-elixir";

export interface MindMapImageActions {
  addImage: (imageData: string) => void;
}

/**
 * Creates a new node with an image and adds it to the mind map
 * @param mindMap Mind Elixir instance
 * @param imageData Base64 image data
 * @returns The created node ID
 */
export const addImageToMindMap = (mindMap: MindElixirInstance, imageData: string): string | null => {
  if (!mindMap) return null;
  
  try {
    // Get the currently selected node or root node
    const activeNode = mindMap.currentNode || null;
    
    // If no active node, use the root node
    const targetNode = activeNode || mindMap.nodeData;
    
    if (!targetNode) {
      console.error("No node selected and root not available");
      return null;
    }
    
    // Create new node with image HTML
    const nodeId = `image_${Date.now()}`;
    const nodeTopicHTML = `
      <div class="me-image-node">
        <img src="${imageData}" style="max-width: 200px; max-height: 150px;" />
      </div>
    `;
    
    // Get target node ID
    const parentId = targetNode.id;
    
    // Add the child node with the correct API
    // We need to cast the string to any to bypass the type check
    mindMap.addChild('Figure' as any, parentId);
    
    // Get the newly created node
    // To accommodate the API, we need to access nodes differently
    const allNodes = mindMap.nodeData ? [mindMap.nodeData, ...(mindMap.nodeData.children || [])] : [];
    
    // Find the node we just created (usually the last child of the parent)
    const children = targetNode.children || [];
    let lastAddedNode = null;
    
    if (children.length > 0) {
      const lastChildId = children[children.length - 1].id;
      lastAddedNode = allNodes.find((node: NodeObj) => node.id === lastChildId);
    }
    
    if (lastAddedNode) {
      // Update the node properties directly - don't use updateNodeStyle
      // as it doesn't exist in this version of the API
      lastAddedNode.id = nodeId;
      lastAddedNode.topicHTML = nodeTopicHTML;
      
      // Refresh to apply changes
      mindMap.refresh();
      return nodeId;
    }
    
    return null;
  } catch (error) {
    console.error("Error adding image to mind map:", error);
    return null;
  }
};

/**
 * Gets all nodes from the mind map tree
 * @param mindMap Mind Elixir instance
 * @returns Array of all nodes in the mind map
 */
export const getAllNodes = (mindMap: MindElixirInstance): NodeObj[] => {
  if (!mindMap || !mindMap.nodeData) return [];
  
  // Helper function to flatten the node tree
  const flattenNodes = (node: NodeObj, results: NodeObj[] = []): NodeObj[] => {
    results.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => flattenNodes(child, results));
    }
    return results;
  };
  
  return flattenNodes(mindMap.nodeData);
};

/**
 * Extends the MindElixir instance with image support methods
 * @param mindMapInstance The Mind Elixir instance to extend
 */
export const extendMindMapWithImageSupport = (mindMapInstance: MindElixirInstance): void => {
  if (!mindMapInstance) return;
  
  // We'll use MindElixir's native API and only add custom methods if needed
  // This approach avoids type errors with the official API
  
  // Example of extending with a custom method if needed:
  (mindMapInstance as any).addImageToSelectedNode = (imageData: string) => {
    return addImageToMindMap(mindMapInstance, imageData);
  };
};
