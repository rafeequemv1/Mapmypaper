
import { Brain, ArrowLeft, FileText, MessageSquare, Keyboard, Download, GitBranch, FlowChart } from "lucide-react";
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

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap?: (type: 'svg' | 'png') => void;
  onOpenFlowchart?: () => void;
}

const Header = ({ 
  showPdf, 
  togglePdf, 
  pdfAvailable, 
  showChat, 
  toggleChat,
  onExportMindMap,
  onOpenFlowchart
}: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
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
      
      {/* Center section - Toggle buttons for research assistant and PDF */}
      <div className="flex items-center justify-center w-1/3 gap-4">
        <Toggle 
          pressed={showChat} 
          onPressedChange={toggleChat}
          aria-label="Toggle research assistant"
          className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Research Assistant</span>
        </Toggle>
        
        {pdfAvailable && (
          <Toggle 
            pressed={showPdf} 
            onPressedChange={togglePdf}
            aria-label="Toggle PDF view"
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">PDF</span>
          </Toggle>
        )}
        
        {onOpenFlowchart && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenFlowchart}
            className="bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Create Flowchart</span>
          </Button>
        )}
      </div>
      
      {/* Keyboard shortcuts on the right */}
      <div className="flex items-center justify-end gap-4 w-1/3">
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
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-2 bg-white shadow-md rounded-md w-64 max-h-80 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
              <ul className="space-y-1 text-xs">
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Enter</span>
                  <span className="text-gray-600">Insert sibling node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Tab</span>
                  <span className="text-gray-600">Insert child node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Delete</span>
                  <span className="text-gray-600">Remove node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">F2</span>
                  <span className="text-gray-600">Edit current node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + C/V</span>
                  <span className="text-gray-600">Copy/Paste</span>
                </li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Header;
