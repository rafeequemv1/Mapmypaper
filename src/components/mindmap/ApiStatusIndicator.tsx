
import React from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiStatusIndicatorProps {
  status: 'idle' | 'loading' | 'error' | 'success';
  onRetry?: () => void;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  status, 
  onRetry 
}) => {
  return (
    <div className="flex items-center gap-2">
      {status === 'loading' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-amber-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Connecting...</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connecting to Gemini API</p>
          </TooltipContent>
        </Tooltip>
      )}

      {status === 'error' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">API Error</span>
              {onRetry && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gemini API connection failed. Check your API key in the .env file.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {status === 'success' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">API Connected</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Successfully connected to Gemini API</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default ApiStatusIndicator;
