
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
    const selectedNode = mindMap.getSelectedNode() || mindMap.root;
    
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
    
    // Add the node to the selected node
    const newNode = mindMap.addChildNode(selectedNode, {
      topic: 'Figure', 
      id: nodeId,
      topicHTML: nodeTopicHTML,
      expanded: true,
      direction: selectedNode.direction || 'right'
    });
    
    // Select the new node
    mindMap.selectNode(newNode);
    
    return nodeId;
  } catch (error) {
    console.error("Error adding image to mind map:", error);
    return null;
  }
};

/**
 * Adds methods to the MindMapViewer component reference
 * @param mindMapRef React ref object for the mind map component
 * @param mindMapInstance Mind Elixir instance
 */
export const extendMindMapWithImageSupport = (
  mindMapRef: React.MutableRefObject<MindMapImageActions | null>,
  mindMapInstance: any
): void => {
  if (!mindMapRef || !mindMapInstance) return;
  
  mindMapRef.current = {
    addImage: (imageData: string) => {
      addImageToMindMap(mindMapInstance, imageData);
    }
  };
};
