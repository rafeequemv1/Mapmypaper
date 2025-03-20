
import { Brain, ArrowLeft, FileText, MessageSquare, Keyboard, Download, Upload, FileDigit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap?: (type: 'svg' | 'png') => void;
  onOpenSummary?: () => void;
}

// Define keyboard shortcuts for the mind map
const keyboardShortcuts = [
  { key: "Enter", description: "Insert sibling node" },
  { key: "Shift + Enter", description: "Insert sibling node before" },
  { key: "Tab", description: "Insert child node" },
  { key: "Ctrl + Enter", description: "Insert parent node" },
  { key: "F1", description: "Center mind map" },
  { key: "F2", description: "Edit current node" },
  { key: "↑", description: "Select previous node" },
  { key: "↓", description: "Select next node" },
  { key: "← / →", description: "Select nodes on the left/right" },
  { key: "PageUp / Alt + ↑", description: "Move up" },
  { key: "PageDown / Alt + ↓", description: "Move down" },
  { key: "Ctrl + ↑", description: "Use two-sided layout" },
  { key: "Ctrl + ←", description: "Use left-sided layout" },
  { key: "Ctrl + →", description: "Use right-sided layout" },
  { key: "Ctrl + C", description: "Copy" },
  { key: "Ctrl + V", description: "Paste" },
  { key: "Ctrl + \"+\"", description: "Zoom in mind map" },
  { key: "Ctrl + \"-\"", description: "Zoom out mind map" },
  { key: "Ctrl + 0", description: "Reset size" },
  { key: "Delete", description: "Remove node" },
];

const Header = ({ 
  showPdf, 
  togglePdf, 
  pdfAvailable, 
  showChat, 
  toggleChat,
  onExportMindMap,
  onOpenSummary,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleBack = () => {
    navigate("/");
  };

  const handleUploadClick = () => {
    // Navigate to the upload page
    navigate("/");
  };

  const toggleShortcuts = () => {
    setShowShortcuts(prev => !prev);
  };

  return (
    <div className="py-2 px-4 border-b bg-[#222222] flex items-center">
      <div className="flex items-center gap-2 w-1/3">
        <Brain className="h-5 w-5 text-white" />
        <h1 className="text-base font-medium text-white">PaperMind</h1>
        
        <Button variant="ghost" size="sm" className="text-white ml-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
      
      {/* Center section - Toggle buttons for PDF and research assistant */}
      <div className="flex items-center justify-center w-1/3 gap-4">
        {pdfAvailable && (
          <Toggle 
            pressed={showPdf} 
            onPressedChange={togglePdf}
            aria-label="Toggle PDF"
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">PDF</span>
          </Toggle>
        )}
        
        <Toggle 
          pressed={showChat} 
          onPressedChange={toggleChat}
          aria-label="Toggle research assistant"
          className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Research Assistant</span>
        </Toggle>
        
        {onOpenSummary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenSummary}
            className="bg-[#8B5CF6] hover:bg-[#7c4deb] text-white border-none rounded-md px-4 py-1 h-auto"
          >
            <FileDigit className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Summarize</span>
          </Button>
        )}
      </div>
      
      {/* Actions on the right */}
      <div className="flex items-center justify-end gap-4 w-1/3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white"
          onClick={handleUploadClick}
        >
          <Upload className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Upload PDF</span>
        </Button>
        
        {onExportMindMap && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExportMindMap('svg')}>
                Download as SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportMindMap('png')}>
                Download as PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white"
            onClick={toggleShortcuts}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          
          {showShortcuts && (
            <div 
              className="absolute right-0 top-full mt-2 p-4 bg-white shadow-md rounded-md w-72 max-h-96 overflow-y-auto z-50"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={toggleShortcuts}
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-2 text-xs">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">{shortcut.key}</span>
                    <span className="text-gray-600">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
