
import React, { useCallback } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onExport?: () => void;
  onExportAsPNG?: () => void; 
  onExportAsSVG?: () => void;
  onExplain?: () => void; 
}

const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  onCopy,
  onPaste,
  onDelete,
  onAddChild,
  onAddSibling,
  onExport,
  onExportAsPNG,
  onExportAsSVG,
  onExplain
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
        {onExplain && (
          <ContextMenuItem onClick={handleAction(onExplain)} className="cursor-pointer text-indigo-600 font-medium">
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
        {onExport && (
          <ContextMenuItem onClick={handleAction(onExport)} className="cursor-pointer text-purple-600">
            Export Node Structure
          </ContextMenuItem>
        )}
        {onExportAsPNG && (
          <ContextMenuItem onClick={handleAction(onExportAsPNG)} className="cursor-pointer text-amber-600">
            Export as PNG
          </ContextMenuItem>
        )}
        {onExportAsSVG && (
          <ContextMenuItem onClick={handleAction(onExportAsSVG)} className="cursor-pointer text-sky-600">
            Export as SVG
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
