
import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Copy, Clipboard, Trash, PlusCircle, Edit, Lightbulb } from "lucide-react";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onAIExpand?: () => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling,
  onAIExpand
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
        <ContextMenuItem onClick={handleCopy} className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste} className="flex items-center gap-2">
          <Clipboard className="h-4 w-4" />
          Paste
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="flex items-center gap-2">
          <Trash className="h-4 w-4" />
          Delete
        </ContextMenuItem>
        {onAddChild && (
          <ContextMenuItem onClick={onAddChild} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Child Node
          </ContextMenuItem>
        )}
        {onAddSibling && (
          <ContextMenuItem onClick={onAddSibling} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Add Sibling Node
          </ContextMenuItem>
        )}
        {onAIExpand && (
          <ContextMenuItem onClick={onAIExpand} className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Expand
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
