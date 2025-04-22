
import React, { useState, useEffect } from "react";
import FlowchartSVGRenderer from "./FlowchartSVGRenderer";
import FlowchartLoading from "./FlowchartLoading";
import FlowchartError from "./FlowchartError";
import RateLimitMessage from "./RateLimitMessage";
import { isRateLimitError } from "./utils/retryUtils";

interface FlowchartPreviewBodyProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  zoomLevel?: number;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

const FlowchartPreviewBody = ({
  code,
  error,
  isGenerating,
  theme,
  previewRef,
  zoomLevel = 1,
  onRetry,
  retryCount = 0,
  maxRetries = 5
}: FlowchartPreviewBodyProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  
  // Trigger re-render after mount to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderAttempt(prev => prev + 1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle error cases
  if (isGenerating) {
    return <FlowchartLoading />;
  }

  if (error) {
    // Check for rate limit error using the utility function
    if (isRateLimitError(error) && onRetry) {
      const handleRetry = () => {
        setIsRetrying(true);
        if (onRetry) {
          Promise.resolve(onRetry())
            .finally(() => setIsRetrying(false));
        }
      };

      return (
        <RateLimitMessage 
          onRetry={handleRetry} 
          isRetrying={isRetrying}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }
    return <FlowchartError error={error} />;
  }

  return (
    <FlowchartSVGRenderer
      code={code}
      theme={theme}
      isGenerating={isGenerating}
      error={error}
      zoomLevel={zoomLevel}
      previewRef={previewRef}
      renderAttempt={renderAttempt}
    />
  );
};

export default FlowchartPreviewBody;
