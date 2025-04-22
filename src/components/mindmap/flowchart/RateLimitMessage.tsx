
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, RefreshCw, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface RateLimitMessageProps {
  onRetry: () => void;
  isRetrying: boolean;
  retryCount?: number;
  maxRetries?: number;
}

const RateLimitMessage: React.FC<RateLimitMessageProps> = ({ 
  onRetry, 
  isRetrying,
  retryCount = 0,
  maxRetries = 5
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">API Rate Limit Reached</h3>
      <p className="text-center mb-4">
        The Gemini API has limits on how many requests you can make per minute.
      </p>
      
      {retryCount > 0 && (
        <Alert variant="default" className="mb-4 bg-amber-100 border-amber-300">
          <Info className="h-4 w-4" />
          <AlertTitle>Automatic Retry in Progress</AlertTitle>
          <AlertDescription>
            Attempt {retryCount}/{maxRetries} - The system is automatically trying to resolve this issue.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-2 text-sm mb-4">
        <Clock className="h-4 w-4" />
        <span>Please wait a moment before trying again</span>
      </div>
      <Button 
        variant="outline" 
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </Button>
    </div>
  );
};

export default RateLimitMessage;
