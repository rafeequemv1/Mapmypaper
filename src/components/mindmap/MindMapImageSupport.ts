
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
    const selectedNode = mindMap.getSelectedNode() || 
                         mindMap.getAllDataNodeRef()['root'];
    
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
    
    // Add the node to the selected node using standard API
    const newNode = {
      topic: 'Figure', 
      id: nodeId,
      topicHTML: nodeTopicHTML,
      expanded: true,
      direction: selectedNode.direction || 'right'
    };
    
    // Add the child node
    mindMap.insertNode(selectedNode, newNode.topic, newNode);
    
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
  
  // Add custom method for image support
  mindMapInstance.addImageToNode = (node: any, imageData: string) => {
    if (!node) return null;
    
    // Create image HTML
    const imageHTML = `
      <div class="me-image-node">
        <img src="${imageData}" style="max-width: 200px; max-height: 150px;" />
      </div>
    `;
    
    // Update node with image 
    // If node already has HTML content, add the image to it
    if (node.topicHTML) {
      node.topicHTML += imageHTML;
    } else {
      // Store original text and add image
      const originalText = node.topic || '';
      node.topicHTML = `<div>${originalText}</div>${imageHTML}`;
    }
    
    // Trigger a node update event to refresh the UI
    mindMapInstance.refresh();
    
    return node.id;
  };
};
