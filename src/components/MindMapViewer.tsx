
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import MindElixir, { type MindElixirInstance, type NodeObj } from "mind-elixir";
import { MindMapImageActions, extendMindMapWithImageSupport, addImageToMindMap, getAllNodes } from "./mindmap/MindMapImageSupport";
import "../styles/mind-map-image.css";
import MindMapContextMenu from "./mindmap/MindMapContextMenu";
import { useToast } from "@/hooks/use-toast";

export interface MindMapViewerProps {
  isMapGenerated?: boolean;
  onMindMapReady?: (mindMapInstance: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
}

export interface MindMapViewerHandle extends MindMapImageActions {
  scrollToNode: (nodeId: string) => void;
  addImage: (imageData: string) => void;
}

const MindMapViewer = forwardRef<MindMapViewerHandle, MindMapViewerProps>(({ 
  isMapGenerated, 
  onMindMapReady,
  onExplainText 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<MindElixirInstance | null>(null);
  const { toast } = useToast();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Initialize mind map instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Create a default node structure
    const defaultData = {
      nodeData: {
        id: 'root',
        topic: 'Paper Structure',
        root: true,
        children: []
      }
    };

    // Get data from session storage or use default
    let data = defaultData;
    try {
      const storedData = sessionStorage.getItem('mindMapData');
      if (storedData) {
        data = JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Error parsing mind map data:", error);
      // Continue with default data on error
    }

    const options = {
      el: containerRef.current,
      direction: MindElixir.SIDE,
      data: data,
      draggable: true,
      contextMenu: false, // Disable default context menu as we're using our own
      allowUndo: true,
      overflowHidden: false,
      primaryLinkStyle: 2, // Curved links
      primaryNodeHorizontalGap: 80,
      primaryNodeVerticalGap: 30
    };

    try {
      const mindElixir = new MindElixir(options);
      mindElixir.init();
      
      // Extend with image support
      if (mindElixir) {
        extendMindMapWithImageSupport(mindElixir);
      }
      
      // Save to ref
      mindElixirRef.current = mindElixir;
      
      if (onMindMapReady) {
        onMindMapReady(mindElixir);
      }

      // Handle node selection - use the correct event name and type
      mindElixir.bus.addListener('selectNode', (node: NodeObj) => {
        if (node && node.id) {
          setSelectedNodeId(node.id);
        }
      });

      // Handle node deselection
      mindElixir.bus.addListener('unselectNode', () => {
        setSelectedNodeId(null);
      });
    } catch (error) {
      console.error("Error initializing mind map:", error);
      toast({
        title: "Mind Map Error",
        description: "There was an error initializing the mind map. Please try refreshing the page.",
        variant: "destructive",
      });
    }

    return () => {
      if (mindElixirRef.current) {
        // Clean up event listeners - use the correct method and syntax
        const bus = mindElixirRef.current.bus;
        // Manually remove the listeners we added
        bus.removeListener('selectNode', () => {});
        bus.removeListener('unselectNode', () => {});
        mindElixirRef.current = null;
      }
    };
  }, [onMindMapReady, toast]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    scrollToNode: (nodeId: string) => {
      if (mindElixirRef.current) {
        // Find node by ID using our helper function
        const allNodes = getAllNodes(mindElixirRef.current);
        const targetNode = allNodes.find((node: NodeObj) => node.id === nodeId);
        
        if (targetNode) {
          // Select the node to focus on it - need to use proper type casting
          mindElixirRef.current.selectNode(targetNode as any);
        }
      }
    },
    addImage: (imageData: string) => {
      if (mindElixirRef.current) {
        if (selectedNodeId) {
          // Get all nodes using our helper function
          const allNodes = getAllNodes(mindElixirRef.current);
          // Find selected node
          const targetNode = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
          
          if (targetNode && mindElixirRef.current) {
            // Use the custom method from MindMapImageSupport.ts
            addImageToMindMap(mindElixirRef.current, imageData);
            toast({
              title: "Image Added",
              description: "Figure has been added to the mind map",
            });
          } else {
            toast({
              title: "Cannot Add Image",
              description: "Please select a node first or ensure mind map is properly loaded",
              variant: "destructive",
            });
          }
        } else {
          // No node selected, try to add to root
          addImageToMindMap(mindElixirRef.current, imageData);
          toast({
            title: "Image Added",
            description: "Figure has been added to the mind map",
          });
        }
      }
    }
  }));

  // Handle node explanation request
  const handleExplainNode = () => {
    if (selectedNodeId && mindElixirRef.current && onExplainText) {
      // Use our helper function to get all nodes
      const allNodes = getAllNodes(mindElixirRef.current);
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node && node.topic) {
        onExplainText(node.topic.toString());
      }
    }
  };

  // Context menu actions
  const handleCopy = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // The API expects a node object, not just an ID
      const allNodes = getAllNodes(mindElixirRef.current);
      const node = allNodes.find(node => node.id === selectedNodeId);
      if (node) {
        // Use type casting to work around type system limitations
        mindElixirRef.current.copyNode(node as any);
      }
    }
  };

  const handlePaste = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // The paste method needs to be called with the target node
      const allNodes = getAllNodes(mindElixirRef.current);
      const node = allNodes.find(node => node.id === selectedNodeId);
      if (node) {
        // Use the proper paste method with type casting
        mindElixirRef.current.pasteNode(node as any);
      }
    }
  };

  const handleDelete = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // Need to pass the node ID as the correct type
      mindElixirRef.current.removeNode(selectedNodeId as any);
    }
  };

  const handleAddChild = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // Get all nodes using our helper function
      const allNodes = getAllNodes(mindElixirRef.current);
      // Find selected node
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node) {
        // We need to swap the argument order and use proper types
        mindElixirRef.current.addChild(node.id, { topic: 'New Child' } as any);
      }
    }
  };

  const handleAddSibling = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // Get all nodes using our helper function
      const allNodes = getAllNodes(mindElixirRef.current);
      // Find selected node
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node) {
        // We need to use the correct method with proper argument types
        mindElixirRef.current.insertSibling(node.id, { topic: 'New Sibling' } as any);
      }
    }
  };

  return (
    <MindMapContextMenu
      onCopy={handleCopy}
      onPaste={handlePaste}
      onDelete={handleDelete}
      onAddChild={handleAddChild}
      onAddSibling={handleAddSibling}
      onExplain={onExplainText ? handleExplainNode : undefined}
    >
      <div ref={containerRef} className="mind-map-viewer w-full h-full"></div>
    </MindMapContextMenu>
  );
});

MindMapViewer.displayName = "MindMapViewer";

export default MindMapViewer;
