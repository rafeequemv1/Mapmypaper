import { Brain, ArrowLeft, FileText, MessageSquare, Keyboard, Download, Upload, Share2, Network } from "lucide-react";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/");
  };

  const handleUploadClick = () => {
    // Navigate to the upload page
    navigate("/");
  };

  const handleShareMindMap = () => {
    try {
      // For now, we'll create a simple share URL with the current page
      // In a real implementation, you'd want to save the mind map data to a database
      // and generate a unique ID for sharing
      const currentUrl = window.location.href;
      const shareableUrl = `${currentUrl}?shared=true`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareableUrl);
      
      setShareUrl(shareableUrl);
      
      toast({
        title: "Share link created",
        description: "The link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        title: "Failed to create share link",
        description: "There was an error creating the share link.",
        variant: "destructive"
      });
    }
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
            <Network className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Create Flowchart</span>
          </Button>
        )}
      </div>
      
      {/* Keyboard shortcuts on the right */}
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
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white"
          onClick={handleShareMindMap}
        >
          <Share2 className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Share</span>
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
