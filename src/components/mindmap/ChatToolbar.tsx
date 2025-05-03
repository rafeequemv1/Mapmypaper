
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, FileText, Search, BarChart2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatToolbarProps {
  onAnalyzeImage?: () => void;
  onSummarizeText?: () => void;
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ onAnalyzeImage, onSummarizeText }) => {
  return (
    <div className="flex items-center gap-1 p-1 px-2 border-b bg-gray-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-gray-600 hover:text-black"
              onClick={onAnalyzeImage}
            >
              <Image className="h-4 w-4 mr-1" />
              <span className="text-xs">Analyze Image</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Upload an image to analyze</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-gray-600 hover:text-black"
              onClick={onSummarizeText}
            >
              <FileText className="h-4 w-4 mr-1" />
              <span className="text-xs">Summarize</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Get a summary of the document</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ChatToolbar;
