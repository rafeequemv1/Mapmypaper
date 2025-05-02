
import React from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ApiStatusIndicatorProps {
  status: 'idle' | 'loading' | 'error' | 'success';
  onRetry?: () => void;
  orientation?: 'horizontal' | 'vertical';
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  status, 
  onRetry,
  orientation = 'horizontal'
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <TooltipProvider>
      <div className={`flex ${isVertical ? 'flex-col' : ''} items-center gap-2`}>
        {status === 'loading' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? "right" : "bottom"}>
              <p>API connection in progress...</p>
            </TooltipContent>
          </Tooltip>
        )}

        {status === 'error' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {!isVertical && <span className="ml-2 text-sm font-medium text-red-500">API Error</span>}
                {onRetry && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onRetry} 
                    className={`${isVertical ? 'mt-1 p-1 h-auto' : 'ml-2'}`}
                  >
                    <Loader2 className="h-4 w-4" />
                    {!isVertical && <span className="ml-1">Retry</span>}
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? "right" : "bottom"}>
              <p>API connection failed</p>
            </TooltipContent>
          </Tooltip>
        )}

        {status === 'success' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {!isVertical && <span className="ml-2 text-sm font-medium text-green-500">API Connected</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent side={isVertical ? "right" : "bottom"}>
              <p>API connection successful</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ApiStatusIndicator;
