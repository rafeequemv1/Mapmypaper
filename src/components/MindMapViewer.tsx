
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import MindElixir, { type MindElixirInstance, type NodeObj, type Topic } from "mind-elixir";
import { MindMapImageActions, extendMindMapWithImageSupport, addImageToMindMap } from "./mindmap/MindMapImageSupport";
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

      // Handle node selection
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
        // Remove event listeners
        mindElixirRef.current.bus.removeAllListeners();
        mindElixirRef.current = null;
      }
    };
  }, [onMindMapReady, toast]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    scrollToNode: (nodeId: string) => {
      if (mindElixirRef.current) {
        // Find node by ID - using the correct API
        const allNodes = mindElixirRef.current.getAllDataList();
        const targetNode = allNodes.find((node: NodeObj) => node.id === nodeId);
        
        if (targetNode) {
          // Select the node to focus on it
          mindElixirRef.current.selectNode(targetNode);
        }
      }
    },
    addImage: (imageData: string) => {
      if (mindElixirRef.current) {
        if (selectedNodeId) {
          // Get all nodes
          const allNodes = mindElixirRef.current.getAllDataList();
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
      const allNodes = mindElixirRef.current.getAllDataList();
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node && node.topic) {
        onExplainText(node.topic.toString());
      }
    }
  };

  // Context menu actions
  const handleCopy = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.copyNode(selectedNodeId);
    }
  };

  const handlePaste = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.paste(selectedNodeId);
    }
  };

  const handleDelete = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.removeNode(selectedNodeId);
    }
  };

  const handleAddChild = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // Get all nodes
      const allNodes = mindElixirRef.current.getAllDataList();
      // Find selected node
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node) {
        // Convert string to Topic type by creating a simple string
        mindElixirRef.current.addChild('New Child' as Topic, selectedNodeId);
      }
    }
  };

  const handleAddSibling = () => {
    if (mindElixirRef.current && selectedNodeId) {
      // Get all nodes
      const allNodes = mindElixirRef.current.getAllDataList();
      // Find selected node
      const node = allNodes.find((node: NodeObj) => node.id === selectedNodeId);
      if (node) {
        // Convert string to Topic type
        mindElixirRef.current.insertSibling('New Sibling' as Topic, selectedNodeId);
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
