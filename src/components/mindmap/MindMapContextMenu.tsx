
import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-white shadow-lg border rounded-lg z-50">
        <ContextMenuItem onClick={handleCopy} className="cursor-pointer">
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste} className="cursor-pointer">
          Paste
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="cursor-pointer">
          Delete
        </ContextMenuItem>
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
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
