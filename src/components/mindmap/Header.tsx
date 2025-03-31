import { Brain, ArrowLeft, FileText, MessageSquare, Keyboard, Download, Upload, FileDigit, Search, FlowChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  onOpenFlowchart?: () => void;
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
  onOpenFlowchart,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleBack = () => {
    navigate("/");
  };

  const handleUploadClick = () => {
    navigate("/");
  };

  const toggleShortcuts = () => {
    setShowShortcuts(prev => !prev);
  };

  return (
    <div className="flex h-12 border-b shadow-sm">
      {/* Left sidebar with brain logo and back button */}
      <div className="w-14 bg-white flex flex-col items-center py-3 border-r">
        {/* App logo */}
        <div className="mb-2">
          <Brain className="h-6 w-6 text-gray-700" />
        </div>
        
        {/* Back button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-700 h-8 w-8 p-0" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Back to home</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Top header with icons */}
      <div className="h-12 bg-white flex items-center justify-between px-4 w-full">
        {/* Left spacing */}
        <div className="w-20"></div>
        
        {/* Center section with main tools */}
        <div className="flex items-center justify-center space-x-4">
          <TooltipProvider>
            {/* PDF toggle */}
            {pdfAvailable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={togglePdf}
                    className={`px-2 h-8 ${showPdf ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    <FileText className="h-5 w-5 mr-1" />
                    <span className="text-xs">PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Toggle PDF view</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Chat toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={toggleChat}
                  className={`px-2 h-8 ${showChat ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <MessageSquare className="h-5 w-5 mr-1" />
                  <span className="text-xs">Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle research assistant</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Flowchart button */}
            {onOpenFlowchart && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onOpenFlowchart}
                    className="text-gray-500 px-2 h-8"
                  >
                    <FlowChart className="h-5 w-5 mr-1" />
                    <span className="text-xs">Flowchart</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Generate flowchart</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Summary button */}
            {onOpenSummary && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onOpenSummary}
                    className="text-gray-500 px-2 h-8"
                  >
                    <FileDigit className="h-5 w-5 mr-1" />
                    <span className="text-xs">Summary</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>View summary</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
        
        {/* Right section with utility tools */}
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            {/* Upload button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 h-8 w-8"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Upload new PDF</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Export dropdown */}
            {onExportMindMap && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 h-8 w-8">
                        <Download className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Export mind map</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" side="bottom">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 h-8 w-8"
                  onClick={toggleShortcuts}
                >
                  <Keyboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Keyboard shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div 
          className="absolute top-12 right-4 p-4 bg-white shadow-md rounded-md w-72 max-h-96 overflow-y-auto z-50"
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
  );
};

export default Header;
