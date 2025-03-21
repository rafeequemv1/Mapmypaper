
import { MindElixirInstance } from "mind-elixir";

// Types for mind map operations
type NodeStyleOptions = {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: string;
  borderWidth?: string;
  borderRadius?: string;
};

export type MindMapNode = {
  id: string;
  topic: string;
  children?: MindMapNode[];
  tags?: string[];
  style?: NodeStyleOptions;
};

/**
 * Executes an operation on the mind map based on command text
 * @param mindMap The mind map instance
 * @param commandText The command text from chat
 * @returns Result message to display in chat
 */
export const processMindMapCommand = (
  mindMap: MindElixirInstance | null, 
  commandText: string
): string => {
  if (!mindMap) {
    return "Error: Mind map is not initialized.";
  }

  // Parse the command (expected format: /command parameter1 parameter2 ...)
  const parts = commandText.trim().split(/\s+/);
  const command = parts[0].toLowerCase();

  try {
    switch (command) {
      case "/add":
        return addNode(mindMap, parts);
      case "/update":
        return updateNode(mindMap, parts);
      case "/delete":
        return deleteNode(mindMap, parts);
      case "/style":
        return styleNode(mindMap, parts);
      case "/export":
        return exportMindMap(mindMap);
      case "/help":
        return getHelpText();
      default:
        return `Unknown command: ${command}. Try /help for available commands.`;
    }
  } catch (error) {
    console.error("Mind map command error:", error);
    return `Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Add a new node to the mind map
 */
const addNode = (mindMap: MindElixirInstance, parts: string[]): string => {
  // Format: /add [parentId] nodeName
  if (parts.length < 3) {
    return "Usage: /add [parentId] nodeName - Adds a new node to the specified parent";
  }

  const parentId = parts[1];
  const nodeName = parts.slice(2).join(" ");
  
  try {
    const root = mindMap.nodeData;
    
    // Find the parent node
    const findNode = (node: any, id: string): any => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const parentNode = findNode(root, parentId);
    
    if (!parentNode) {
      return `Parent node with ID ${parentId} not found. Use /export to see available IDs.`;
    }
    
    // Add the new node
    const newNode = mindMap.addChild(parentNode, nodeName);
    
    return `Added new node "${nodeName}" with ID ${newNode.id} to parent "${parentNode.topic}"`;
  } catch (error) {
    console.error("Error adding node:", error);
    return `Failed to add node: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Update an existing node's topic
 */
const updateNode = (mindMap: MindElixirInstance, parts: string[]): string => {
  // Format: /update nodeId newTopic
  if (parts.length < 3) {
    return "Usage: /update nodeId newTopic - Updates the text of the specified node";
  }

  const nodeId = parts[1];
  const newTopic = parts.slice(2).join(" ");
  
  try {
    // Find the node to update
    const root = mindMap.nodeData;
    
    const findNode = (node: any, id: string): any => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const targetNode = findNode(root, nodeId);
    
    if (!targetNode) {
      return `Node with ID ${nodeId} not found. Use /export to see available IDs.`;
    }
    
    // Update the node topic
    const oldTopic = targetNode.topic;
    mindMap.updateNodeTopic(targetNode, newTopic);
    
    return `Updated node: "${oldTopic}" → "${newTopic}"`;
  } catch (error) {
    console.error("Error updating node:", error);
    return `Failed to update node: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Delete a node from the mind map
 */
const deleteNode = (mindMap: MindElixirInstance, parts: string[]): string => {
  // Format: /delete nodeId
  if (parts.length < 2) {
    return "Usage: /delete nodeId - Deletes the specified node and its children";
  }

  const nodeId = parts[1];
  
  try {
    // Find the node to delete
    const root = mindMap.nodeData;
    
    // Don't allow deleting the root node
    if (nodeId === root.id) {
      return "Cannot delete the root node.";
    }
    
    const findNodeAndParent = (node: any, id: string, parent: any = null): [any, any] => {
      if (node.id === id) return [node, parent];
      if (node.children) {
        for (const child of node.children) {
          const [found, foundParent] = findNodeAndParent(child, id, node);
          if (found) return [found, foundParent];
        }
      }
      return [null, null];
    };
    
    const [targetNode, parentNode] = findNodeAndParent(root, nodeId);
    
    if (!targetNode) {
      return `Node with ID ${nodeId} not found. Use /export to see available IDs.`;
    }
    
    // Delete the node
    const nodeTopic = targetNode.topic;
    mindMap.removeNode(targetNode);
    
    return `Deleted node "${nodeTopic}" with ID ${nodeId}`;
  } catch (error) {
    console.error("Error deleting node:", error);
    return `Failed to delete node: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Apply styling to a node
 */
const styleNode = (mindMap: MindElixirInstance, parts: string[]): string => {
  // Format: /style nodeId property=value property2=value2 ...
  if (parts.length < 3) {
    return "Usage: /style nodeId property=value ... - Apply styling to the specified node. Properties: backgroundColor, borderColor, textColor, fontSize, borderWidth, borderRadius";
  }

  const nodeId = parts[1];
  const styleArgs = parts.slice(2);
  
  try {
    // Find the node to style
    const root = mindMap.nodeData;
    
    const findNode = (node: any, id: string): any => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const targetNode = findNode(root, nodeId);
    
    if (!targetNode) {
      return `Node with ID ${nodeId} not found. Use /export to see available IDs.`;
    }
    
    // Parse styling arguments
    const styles: Record<string, string> = {};
    
    for (const arg of styleArgs) {
      const [property, value] = arg.split('=');
      if (!property || !value) {
        return `Invalid style format: ${arg}. Use property=value format.`;
      }
      styles[property] = value;
    }
    
    // Get the DOM element for the node
    const nodeEl = document.querySelector(`[data-nodeid="${nodeId}"]`);
    if (!nodeEl) {
      return `DOM element for node ${nodeId} not found.`;
    }
    
    // Apply styles to node
    Object.entries(styles).forEach(([property, value]) => {
      switch (property) {
        case 'backgroundColor':
          nodeEl.style.backgroundColor = value;
          break;
        case 'borderColor':
          nodeEl.style.borderColor = value;
          break;
        case 'textColor':
          nodeEl.style.color = value;
          break;
        case 'fontSize':
          nodeEl.style.fontSize = value;
          break;
        case 'borderWidth':
          nodeEl.style.borderWidth = value;
          break;
        case 'borderRadius':
          nodeEl.style.borderRadius = value;
          break;
        default:
          console.warn(`Unknown style property: ${property}`);
      }
    });
    
    // Store styles on the node data for persistence
    if (!targetNode.style) targetNode.style = {};
    Object.assign(targetNode.style, styles);
    
    return `Styled node "${targetNode.topic}" with: ${Object.entries(styles)
      .map(([property, value]) => `${property}=${value}`)
      .join(', ')}`;
  } catch (error) {
    console.error("Error styling node:", error);
    return `Failed to style node: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Export the mind map structure as formatted JSON
 */
const exportMindMap = (mindMap: MindElixirInstance): string => {
  try {
    const data = mindMap.getData();
    return "```json\n" + JSON.stringify(data, null, 2) + "\n```\n\nUse node IDs from this export with other commands.";
  } catch (error) {
    console.error("Error exporting mind map:", error);
    return `Failed to export mind map: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

/**
 * Get help text with available commands
 */
const getHelpText = (): string => {
  return `
### Mind Map Chat Commands

- **/add [parentId] nodeName** - Add a new node to a parent
- **/update nodeId newTopic** - Change a node's text
- **/delete nodeId** - Remove a node and its children
- **/style nodeId property=value** - Style a node (properties: backgroundColor, borderColor, textColor, fontSize, borderWidth, borderRadius)
- **/export** - Show mind map structure with node IDs
- **/help** - Show this help message

Example: \`/add root My new idea\` adds a node to the root
Example: \`/style abc123 backgroundColor=#e1f5fe textColor=#01579b\` styles node abc123
`;
};
