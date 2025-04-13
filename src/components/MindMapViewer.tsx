
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import MindElixir, { type MindElixirInstance } from "mind-elixir";
import { MindMapImageActions, extendMindMapWithImageSupport } from "./mindmap/MindMapImageSupport";
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

    const options = {
      el: containerRef.current,
      direction: MindElixir.SIDE,
      data: {
        nodeData: {
          id: 'root',
          topic: 'Paper Structure',
          root: true,
          children: []
        }
      },
      draggable: true,
      contextMenu: false, // Disable default context menu as we're using our own
      allowUndo: true,
      overflowHidden: false,
      primaryLinkStyle: 2, // Curved links
      primaryNodeHorizontalGap: 80,
      primaryNodeVerticalGap: 30
    };

    const mindElixir = new MindElixir(options);
    mindElixir.init();
    
    // Extend with image support
    extendMindMapWithImageSupport(mindElixir);
    
    // Save to ref
    mindElixirRef.current = mindElixir;
    
    if (onMindMapReady) {
      onMindMapReady(mindElixir);
    }

    // Handle node selection
    mindElixir.bus.addListener('select', (node: any) => {
      if (node && node.id) {
        setSelectedNodeId(node.id);
      }
    });

    // Handle node deselection
    mindElixir.bus.addListener('unselectNode', () => {
      setSelectedNodeId(null);
    });

    return () => {
      if (mindElixirRef.current) {
        // Clean up the mind map instance
        mindElixirRef.current.removeEvents();
        mindElixirRef.current = null;
      }
    };
  }, [onMindMapReady]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    scrollToNode: (nodeId: string) => {
      if (mindElixirRef.current) {
        const node = mindElixirRef.current.selectNodeById(nodeId);
        if (node) {
          // Scroll to the node (additional logic could be added here)
          node.focus();
        }
      }
    },
    addImage: (imageData: string) => {
      if (mindElixirRef.current) {
        // Get selected node or root node
        const targetNode = selectedNodeId 
          ? mindElixirRef.current.getNodeById(selectedNodeId) 
          : mindElixirRef.current.getNodeById('root');
        
        if (targetNode && mindElixirRef.current.addImageToNode) {
          mindElixirRef.current.addImageToNode(targetNode, imageData);
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
      }
    }
  }));

  // Handle node explanation request
  const handleExplainNode = () => {
    if (selectedNodeId && mindElixirRef.current && onExplainText) {
      const node = mindElixirRef.current.getNodeById(selectedNodeId);
      if (node && node.topic) {
        onExplainText(node.topic);
      }
    }
  };

  // Context menu actions
  const handleCopy = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.copyNode();
    }
  };

  const handlePaste = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.pasteNode();
    }
  };

  const handleDelete = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.removeNode();
    }
  };

  const handleAddChild = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.insertSibling();
    }
  };

  const handleAddSibling = () => {
    if (mindElixirRef.current && selectedNodeId) {
      mindElixirRef.current.insertSibling();
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
