
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
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      // Default copy behavior
      document.execCommand('copy', false, undefined);
    }
  };

  const handlePaste = () => {
    if (onPaste) {
      onPaste();
    } else {
      // Default paste behavior
      document.execCommand('paste', false, undefined);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      // Default delete behavior - with required arguments
      document.execCommand('delete', false, undefined);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleCopy}>
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste}>
          Paste
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete}>
          Delete
        </ContextMenuItem>
        {onAddChild && (
          <ContextMenuItem onClick={onAddChild}>
            Add Child Node
          </ContextMenuItem>
        )}
        {onAddSibling && (
          <ContextMenuItem onClick={onAddSibling}>
            Add Sibling Node
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
