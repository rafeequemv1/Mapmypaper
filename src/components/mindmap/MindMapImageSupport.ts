
/**
 * Extension for Mind Elixir to add image support
 * This utility file provides functions to add images to mind map nodes
 */

export interface MindMapImageActions {
  addImage: (imageData: string) => void;
}

/**
 * Creates a new node with an image and adds it to the mind map
 * @param mindMap Mind Elixir instance
 * @param imageData Base64 image data
 * @returns The created node ID
 */
export const addImageToMindMap = (mindMap: any, imageData: string): string | null => {
  if (!mindMap) return null;
  
  try {
    // Get the currently selected node or root node
    const selectedNode = mindMap.getActiveNode() || 
                         mindMap.nodeData.find((node: any) => node.id === 'root');
    
    if (!selectedNode) {
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
    
    // Add the node using standard Mind Elixir API
    mindMap.addChild('Figure');
    
    // Get the newly created node and update it with our HTML
    const nodes = mindMap.nodeData;
    const lastAddedNode = nodes[nodes.length - 1]; // Usually the last added node
    
    if (lastAddedNode) {
      lastAddedNode.id = nodeId;
      lastAddedNode.topicHTML = nodeTopicHTML;
      
      // Refresh to apply changes
      mindMap.refresh();
    }
    
    return nodeId;
  } catch (error) {
    console.error("Error adding image to mind map:", error);
    return null;
  }
};

/**
 * Extends the MindElixir instance with image support methods
 * @param mindMapInstance The Mind Elixir instance to extend
 */
export const extendMindMapWithImageSupport = (mindMapInstance: any): void => {
  if (!mindMapInstance) return;
  
  // We'll use MindElixir's native API and only add custom methods if needed
  // This approach avoids type errors with the official API
  
  // Example of extending with a custom method if needed:
  mindMapInstance.addImageToSelectedNode = (imageData: string) => {
    return addImageToMindMap(mindMapInstance, imageData);
  };
};
