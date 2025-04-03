
import React, { useCallback } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";

interface MindMapContextMenuProps {
  children: React.ReactNode;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onAddParent?: () => void;
  onAddSibling?: () => void;
  onRemoveNode?: () => void;
  onFocusMode?: () => void;
  onCancelFocusMode?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSummary?: () => void;
  onLink?: () => void;
  onBidirectionalLink?: () => void;
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
  onAddParent,
  onAddSibling,
  onRemoveNode,
  onFocusMode,
  onCancelFocusMode,
  onMoveUp,
  onMoveDown,
  onSummary,
  onLink,
  onBidirectionalLink,
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
        
        {/* Node Addition/Modification Group */}
        {(onAddChild || onAddParent || onAddSibling) && (
          <>
            {onAddChild && (
              <ContextMenuItem onClick={handleAction(onAddChild)} className="cursor-pointer text-blue-600">
                Add Child
              </ContextMenuItem>
            )}
            {onAddParent && (
              <ContextMenuItem onClick={handleAction(onAddParent)} className="cursor-pointer text-violet-600">
                Add Parent
              </ContextMenuItem>
            )}
            {onAddSibling && (
              <ContextMenuItem onClick={handleAction(onAddSibling)} className="cursor-pointer text-emerald-600">
                Add Sibling
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Basic Operations Group */}
        {(onCopy || onPaste || onRemoveNode || onDelete) && (
          <>
            {(onAddChild || onAddParent || onAddSibling) && <ContextMenuSeparator />}
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
            {onRemoveNode && (
              <ContextMenuItem onClick={handleAction(onRemoveNode)} className="cursor-pointer text-red-500">
                Remove Node
              </ContextMenuItem>
            )}
            {onDelete && (
              <ContextMenuItem onClick={handleAction(onDelete)} className="cursor-pointer text-red-500 font-medium">
                Delete
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Focus Mode Group */}
        {(onFocusMode || onCancelFocusMode) && (
          <>
            <ContextMenuSeparator />
            {onFocusMode && (
              <ContextMenuItem onClick={handleAction(onFocusMode)} className="cursor-pointer text-amber-600">
                Focus Mode
              </ContextMenuItem>
            )}
            {onCancelFocusMode && (
              <ContextMenuItem onClick={handleAction(onCancelFocusMode)} className="cursor-pointer text-amber-600">
                Cancel Focus Mode
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Movement Group */}
        {(onMoveUp || onMoveDown) && (
          <>
            <ContextMenuSeparator />
            {onMoveUp && (
              <ContextMenuItem onClick={handleAction(onMoveUp)} className="cursor-pointer">
                Move Up
              </ContextMenuItem>
            )}
            {onMoveDown && (
              <ContextMenuItem onClick={handleAction(onMoveDown)} className="cursor-pointer">
                Move Down
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Utilities Group */}
        {(onSummary || onLink || onBidirectionalLink) && (
          <>
            <ContextMenuSeparator />
            {onSummary && (
              <ContextMenuItem onClick={handleAction(onSummary)} className="cursor-pointer text-teal-600">
                Summary
              </ContextMenuItem>
            )}
            {onLink && (
              <ContextMenuItem onClick={handleAction(onLink)} className="cursor-pointer text-cyan-600">
                Link
              </ContextMenuItem>
            )}
            {onBidirectionalLink && (
              <ContextMenuItem onClick={handleAction(onBidirectionalLink)} className="cursor-pointer text-cyan-800">
                Bidirectional Link
              </ContextMenuItem>
            )}
          </>
        )}
        
        {/* Export Group */}
        {(onExport || onExportAsPNG || onExportAsSVG) && (
          <>
            <ContextMenuSeparator />
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
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MindMapContextMenu;
