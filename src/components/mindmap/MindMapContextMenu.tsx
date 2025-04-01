
import React from 'react';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger,
  ContextMenuSeparator
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onExplain?: () => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling,
  onExplain
}) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCopy) {
      onCopy();
    }
  };

  const handlePaste = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onPaste) {
      onPaste();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete) {
      onDelete();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddChild) {
      onAddChild();
    }
  };

  const handleAddSibling = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddSibling) {
      onAddSibling();
    }
  };
  
  const handleExplain = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onExplain) {
      onExplain();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-white shadow-lg border rounded-lg z-50">
        {onCopy && (
          <ContextMenuItem onClick={handleCopy} className="cursor-pointer">
            Copy
          </ContextMenuItem>
        )}
        {onPaste && (
          <ContextMenuItem onClick={handlePaste} className="cursor-pointer">
            Paste
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem onClick={handleDelete} className="cursor-pointer">
            Delete
          </ContextMenuItem>
        )}
        {onAddChild && (
          <ContextMenuItem onClick={handleAddChild} className="cursor-pointer">
            Add Child Node
          </ContextMenuItem>
        )}
        {onAddSibling && (
          <ContextMenuItem onClick={handleAddSibling} className="cursor-pointer">
            Add Sibling Node
          </ContextMenuItem>
        )}
        {onExplain && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleExplain} className="cursor-pointer flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="bg-white text-primary border border-primary/20 hover:bg-primary/10 px-2 py-1 h-auto w-full flex justify-start">
                      <Info className="h-4 w-4 mr-2" />
                      Explain Content
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate explanation for this node</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
