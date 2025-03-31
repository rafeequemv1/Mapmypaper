
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
    <div className="flex h-full">
      {/* Left sidebar for vertical icons */}
      <div className="w-16 bg-[#222222] flex flex-col items-center py-4 border-r border-[#333]">
        {/* App logo */}
        <div className="mb-8">
          <Brain className="h-8 w-8 text-white" />
        </div>
        
        {/* Back button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white mb-8" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Back to home</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-col gap-4 items-center">
          {/* PDF toggle */}
          {pdfAvailable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle 
                  pressed={showPdf} 
                  onPressedChange={togglePdf}
                  aria-label="Toggle PDF"
                  className={`bg-transparent hover:bg-white/20 text-white border ${showPdf ? 'border-white' : 'border-white/30'} rounded-md w-10 h-10 p-0`}
                >
                  <FileText className="h-5 w-5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Toggle PDF view</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Chat toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle 
                pressed={showChat} 
                onPressedChange={toggleChat}
                aria-label="Toggle research assistant"
                className={`bg-transparent hover:bg-white/20 text-white border ${showChat ? 'border-white' : 'border-white/30'} rounded-md w-10 h-10 p-0`}
              >
                <MessageSquare className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle research assistant</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Summary button */}
          {onOpenSummary && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onOpenSummary}
                  className="text-white hover:bg-white/20 border border-white/30 rounded-md w-10 h-10 p-0"
                >
                  <FileDigit className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>View summary</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Upload button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20 border border-white/30 rounded-md w-10 h-10 p-0"
                onClick={handleUploadClick}
              >
                <Upload className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Upload new PDF</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Export dropdown */}
          {onExportMindMap && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 border border-white/30 rounded-md w-10 h-10 p-0">
                      <Download className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Export mind map</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center" side="right">
                <DropdownMenuItem onClick={() => onExportMindMap('svg')}>
                  Download as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportMindMap('png')}>
                  Download as PNG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Keyboard shortcuts */}
          <div className="relative mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white hover:bg-white/20 border border-white/30 rounded-md w-10 h-10 p-0"
                  onClick={toggleShortcuts}
                >
                  <Keyboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Keyboard shortcuts</p>
              </TooltipContent>
            </Tooltip>
            
            {showShortcuts && (
              <div 
                className="absolute left-16 bottom-0 p-4 bg-white shadow-md rounded-md w-72 max-h-96 overflow-y-auto z-50"
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
      
      {/* Header title */}
      <div className="h-12 bg-[#222222] flex items-center px-4 w-full">
        <h1 className="text-base font-medium text-white">MapMyPaper</h1>
      </div>
    </div>
  );
};

export default Header;
