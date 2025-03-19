
import { Keyboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Create an array of keyboard shortcuts
const shortcuts = [
  { key: 'Enter', action: 'Insert sibling node' },
  { key: 'Shift + Enter', action: 'Insert sibling node before' },
  { key: 'Tab', action: 'Insert child node' },
  { key: 'Ctrl + Enter', action: 'Insert parent node' },
  { key: 'F1', action: 'Center mind map' },
  { key: 'F2', action: 'Edit current node' },
  { key: '↑', action: 'Select previous node' },
  { key: '↓', action: 'Select next node' },
  { key: '← / →', action: 'Select nodes on the left/right' },
  { key: 'PageUp / Alt + ↑', action: 'Move up' },
  { key: 'PageDown / Alt + ↓', action: 'Move down' },
  { key: 'Ctrl + ↑', action: 'Use two-sided layout' },
  { key: 'Ctrl + ←', action: 'Use left-sided layout' },
  { key: 'Ctrl + →', action: 'Use right-sided layout' },
  { key: 'Delete', action: 'Remove node' },
  { key: 'Ctrl + C', action: 'Copy' },
  { key: 'Ctrl + V', action: 'Paste' },
  { key: 'Ctrl + Z', action: 'Undo' },
  { key: 'Ctrl + Y', action: 'Redo' },
  { key: 'Ctrl + +', action: 'Zoom in mind map' },
  { key: 'Ctrl + -', action: 'Zoom out mind map' },
  { key: 'Ctrl + 0', action: 'Reset size' },
];

interface KeyboardShortcutsTooltipProps {
  isVisible: boolean;
}

const KeyboardShortcutsTooltip = ({ isVisible }: KeyboardShortcutsTooltipProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="absolute top-6 right-5 z-10">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center justify-center w-7 h-7 bg-white rounded-md shadow-sm hover:bg-gray-100 transition-colors ml-2">
              <Keyboard className="h-4 w-4 text-gray-700" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="p-2 bg-white shadow-md rounded-md w-64 max-h-80 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
            <ul className="space-y-1 text-xs">
              {shortcuts.map((shortcut, index) => (
                <li key={index} className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">{shortcut.key}</span>
                  <span className="text-gray-600">{shortcut.action}</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default KeyboardShortcutsTooltip;
