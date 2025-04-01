
import React, { useCallback } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Image, Plus, Copy, Trash, PlusCircle } from "lucide-react";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onAddImage?: () => void;
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling,
  onAddImage
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
        {onCopy && (
          <ContextMenuItem onClick={handleAction(onCopy)} className="cursor-pointer flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </ContextMenuItem>
        )}
        {onPaste && (
          <ContextMenuItem onClick={handleAction(onPaste)} className="cursor-pointer">
            Paste
          </ContextMenuItem>
        )}
        {onAddChild && (
          <ContextMenuItem onClick={handleAction(onAddChild)} className="cursor-pointer text-blue-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Child Node
          </ContextMenuItem>
        )}
        {onAddSibling && (
          <ContextMenuItem onClick={handleAction(onAddSibling)} className="cursor-pointer text-emerald-600 flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Sibling Node
          </ContextMenuItem>
        )}
        {onAddImage && (
          <ContextMenuItem onClick={handleAction(onAddImage)} className="cursor-pointer text-purple-600 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Add Image
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem onClick={handleAction(onDelete)} className="cursor-pointer text-red-500 font-medium flex items-center gap-2">
            <Trash className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
