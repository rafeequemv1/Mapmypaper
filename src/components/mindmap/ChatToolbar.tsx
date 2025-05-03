
import React from "react";
import { Button } from "@/components/ui/button";
import { Image, FileText, BrainCircuit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ChatToolbarProps {
  onAnalyzeImage?: () => void;
  onSummarizeText?: () => void;
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ 
  onAnalyzeImage,
  onSummarizeText
}) => {
  const { toast } = useToast();

  const handleImageAnalysisClick = () => {
    if (onAnalyzeImage) {
      onAnalyzeImage();
    } else {
      toast({
        title: "Feature not available",
        description: "Image analysis functionality is not connected",
        variant: "destructive"
      });
    }
  };

  const handleSummarizeClick = () => {
    if (onSummarizeText) {
      onSummarizeText();
    } else {
      toast({
        title: "Feature not available",
        description: "Text summarization functionality is not connected",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2 px-2 py-1 border-b bg-white items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleImageAnalysisClick}
          >
            <Image size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Analyze image with Gemini Vision</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleSummarizeClick}
          >
            <FileText size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Summarize document text</p>
        </TooltipContent>
      </Tooltip>
      
      <div className="ml-auto flex items-center text-xs text-muted-foreground">
        <BrainCircuit size={14} className="mr-1" />
        <span>Gemini AI</span>
      </div>
    </div>
  );
};

export default ChatToolbar;
