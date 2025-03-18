
import React, { useState, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { Edit, Plus, Trash2, PaintBucket, PenSquare, FileImage, Image } from 'lucide-react';
import { MindElixirInstance } from 'mind-elixir';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addImageToNode } from './mindMapUtils';

interface MindMapContextMenuProps {
  mindMap: MindElixirInstance | null;
  children: React.ReactNode;
  images: Array<{ id: string; data: string; pageNumber: number }>;
  onAddImageToNode: (nodeId: string, imageData: string) => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({ 
  mindMap, 
  children, 
  images,
  onAddImageToNode
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  useEffect(() => {
    // Set ready state when mindMap is available
    if (mindMap) {
      setIsReady(true);
    }
  }, [mindMap]);

  // Define node operations
  const handleAddChild = () => {
    if (mindMap) mindMap.addChild();
  };

  const handleAddSibling = () => {
    if (mindMap) mindMap.insertSibling();
  };

  const handleRemoveNode = () => {
    if (mindMap) mindMap.removeNode();
  };

  const handleEditNode = () => {
    if (mindMap) {
      // Focus on the selected node to edit
      const selectedNode = mindMap.currentNode;
      if (selectedNode) {
        mindMap.selectNode(selectedNode);
        // trigger the built-in edit functionality
        setTimeout(() => {
          // Need a slight delay to ensure the node is selected
          // Fix: Pass the required arguments to execCommand
          document.execCommand('selectAll', false);
          document.execCommand('delete', false);
        }, 50);
      }
    }
  };

  // Add contextmenu event to ensure our custom context menu works
  useEffect(() => {
    if (!mindMap) return;
    
    const container = mindMap.container;
    const handleContextMenu = (e: MouseEvent) => {
      // This just prevents default for custom handling
      // The actual menu is handled by Radix UI ContextMenu
      e.preventDefault();
    };
    
    container.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [mindMap]);

  // Set up color change handlers
  const handleColorChange = (color: string) => {
    if (mindMap && mindMap.currentNode) {
      // Fix: Mind-elixir's updateNodeStyle is not directly on MindElixirInstance
      // Update node style by directly setting the background property
      const nodeId = mindMap.currentNode.id;
      
      // Access the nodes map from mindMap
      if (mindMap.nodes && mindMap.nodes[nodeId]) {
        // Update the node style
        mindMap.nodes[nodeId].style = {
          ...mindMap.nodes[nodeId].style,
          background: color
        };
        
        // Refresh the map to show the changes
        mindMap.refresh();
      }
    }
  };

  // Handle adding an image to the selected node
  const handleOpenImageDialog = () => {
    if (mindMap && mindMap.currentNode) {
      setIsImageDialogOpen(true);
    }
  };

  const handleAddImage = (imageData: string) => {
    if (mindMap && mindMap.currentNode) {
      const nodeId = mindMap.currentNode.id;
      onAddImageToNode(nodeId, imageData);
      setIsImageDialogOpen(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handleEditNode} className="flex items-center">
            <PenSquare className="mr-2 h-4 w-4" />
            Edit Node
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleAddChild} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Child Node
          </ContextMenuItem>
          <ContextMenuItem onClick={handleAddSibling} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Add Sibling Node
          </ContextMenuItem>
          <ContextMenuSeparator />
          {images.length > 0 && (
            <ContextMenuItem onClick={handleOpenImageDialog} className="flex items-center">
              <FileImage className="mr-2 h-4 w-4" />
              Add Image to Node
            </ContextMenuItem>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center">
              <PaintBucket className="mr-2 h-4 w-4" />
              Change Node Color
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem onClick={() => handleColorChange('#E5DEFF')} className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded bg-[#E5DEFF]"></div>
                Purple
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleColorChange('#D3E4FD')} className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded bg-[#D3E4FD]"></div>
                Blue
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleColorChange('#FEC6A1')} className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded bg-[#FEC6A1]"></div>
                Orange
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleColorChange('#FFDEE2')} className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded bg-[#FFDEE2]"></div>
                Pink
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleColorChange('#F2FCE2')} className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded bg-[#F2FCE2]"></div>
                Green
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleRemoveNode} className="flex items-center text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Node
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Image to Node</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4">
            {images.map((image) => (
              <div key={image.id} className="border rounded-md p-2 cursor-pointer hover:bg-accent">
                <img 
                  src={image.data} 
                  alt={`Image from page ${image.pageNumber}`} 
                  className="w-full h-auto object-contain rounded mb-2"
                />
                <Button 
                  onClick={() => handleAddImage(image.data)} 
                  size="sm" 
                  className="w-full"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Use Image
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MindMapContextMenu;
