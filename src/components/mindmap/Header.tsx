
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  showPdf: boolean;
  togglePdf: () => void;
  pdfAvailable: boolean;
  showChat: boolean;
  toggleChat: () => void;
  onExportMindMap?: (type: 'svg' | 'png') => void;
  onOpenSummary?: () => void;
}

const Header = ({ 
  showPdf, 
  togglePdf, 
  pdfAvailable, 
  showChat, 
  toggleChat,
  onExportMindMap,
  onOpenSummary
}: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBack = () => {
    navigate("/");
  };

  const handleUploadClick = () => {
    // Navigate to the upload page
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 bg-white shadow-md rounded-md w-80 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-gray-700 mb-1">Node Operations</h5>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Enter</span>
                  <span className="text-gray-600">Insert sibling node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Shift + Enter</span>
                  <span className="text-gray-600">Insert sibling node before</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Tab</span>
                  <span className="text-gray-600">Insert child node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + Enter</span>
                  <span className="text-gray-600">Insert parent node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">F2</span>
                  <span className="text-gray-600">Edit current node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Delete</span>
                  <span className="text-gray-600">Remove node</span>
                </li>
              </ul>
              
              <h5 className="text-xs font-semibold text-gray-700 mt-3 mb-1">Navigation</h5>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">↑</span>
                  <span className="text-gray-600">Select previous node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">↓</span>
                  <span className="text-gray-600">Select next node</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">← / →</span>
                  <span className="text-gray-600">Select nodes on the left/right</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">PageUp / Alt + ↑</span>
                  <span className="text-gray-600">Move up</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">PageDown / Alt + ↓</span>
                  <span className="text-gray-600">Move down</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">F1</span>
                  <span className="text-gray-600">Center mind map</span>
                </li>
              </ul>
              
              <h5 className="text-xs font-semibold text-gray-700 mt-3 mb-1">Layout Controls</h5>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + ↑</span>
                  <span className="text-gray-600">Use two-sided layout</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + ←</span>
                  <span className="text-gray-600">Use left-sided layout</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + →</span>
                  <span className="text-gray-600">Use right-sided layout</span>
                </li>
              </ul>
              
              <h5 className="text-xs font-semibold text-gray-700 mt-3 mb-1">Other Operations</h5>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + C</span>
                  <span className="text-gray-600">Copy</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + V</span>
                  <span className="text-gray-600">Paste</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + "+"</span>
                  <span className="text-gray-600">Zoom in mind map</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + "-"</span>
                  <span className="text-gray-600">Zoom out mind map</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">Ctrl + 0</span>
                  <span className="text-gray-600">Reset size</span>
                </li>
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default Header;
