
import React, { useCallback } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onExplainNode?: () => void; // Added explain node option
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling,
  onExplainNode // Add explain node handler
}) => {
  const handleAction = useCallback((handler?: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (handler) {
      handler();
    }
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-white shadow-lg border rounded-lg z-[9999]">
        {onExplainNode && (
          <ContextMenuItem onClick={handleAction(onExplainNode)} className="cursor-pointer text-purple-600 font-medium">
            Explain Node
          </ContextMenuItem>
        )}
        {onCopy && (
          <ContextMenuItem onClick={handleAction(onCopy)} className="cursor-pointer">
            Copy
          </ContextMenuItem>
        )}
        {onPaste && (
          <ContextMenuItem onClick={handleAction(onPaste)} className="cursor-pointer">
            Paste
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem onClick={handleAction(onDelete)} className="cursor-pointer text-red-500 font-medium">
            Delete
          </ContextMenuItem>
        )}
        {onAddChild && (
          <ContextMenuItem onClick={handleAction(onAddChild)} className="cursor-pointer text-blue-600">
            Add Child Node
          </ContextMenuItem>
        )}
        {onAddSibling && (
          <ContextMenuItem onClick={handleAction(onAddSibling)} className="cursor-pointer text-emerald-600">
            Add Sibling Node
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
