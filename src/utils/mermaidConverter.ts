
import { MindElixirData } from "mind-elixir";

/**
 * Convert MindElixir data structure to Mermaid flowchart syntax
 */
export const convertToMermaidFlowchart = (data: MindElixirData): string => {
  let mermaidCode = "flowchart TD\n";
  let nodeCounter = 1;
  const nodeMap = new Map<string, string>();

  // Helper function to process nodes recursively
  const processNode = (node: any, parentId?: string) => {
    // Create a unique id for this node
    const nodeId = `node${nodeCounter++}`;
    nodeMap.set(node.id, nodeId);
    
    // Add the node definition
    const nodeText = node.topic.replace(/[^a-zA-Z0-9 ]/g, ""); // Sanitize text
    mermaidCode += `    ${nodeId}["${nodeText}"]\n`;
    
    // Connect to parent if exists
    if (parentId) {
      mermaidCode += `    ${parentId} --> ${nodeId}\n`;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        processNode(child, nodeId);
      }
    }
  };

  // Start with the root node
  if (data && data.root) {
    processNode(data.root);
  }

  return mermaidCode;
};

/**
 * Convert MindElixir data structure to Mermaid mindmap syntax
 */
export const convertToMermaidMindmap = (data: MindElixirData): string => {
  let mermaidCode = "mindmap\n";
  
  // Helper function to process nodes recursively
  const processNode = (node: any, depth: number = 0) => {
    // Create indentation based on depth
    const indent = "  ".repeat(depth);
    
    // Add the node definition with proper indentation
    const nodeText = node.topic.replace(/[^\w\s]/g, ""); // Sanitize text
    
    // Root node gets special formatting
    if (depth === 0) {
      mermaidCode += `${indent}root((${nodeText}))\n`;
    } else {
      mermaidCode += `${indent}${nodeText}\n`;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        processNode(child, depth + 1);
      }
    }
  };

  // Start with the root node
  if (data && data.root) {
    processNode(data.root);
  }

  return mermaidCode;
};

/**
 * Convert MindElixir data to specialized formats as needed
 */
export const convertToMermaidSpecialized = (data: MindElixirData, format: string): string => {
  switch (format) {
    case 'flowchart':
      return convertToMermaidFlowchart(data);
    case 'mindmap':
      return convertToMermaidMindmap(data);
    default:
      return convertToMermaidFlowchart(data);
  }
};
