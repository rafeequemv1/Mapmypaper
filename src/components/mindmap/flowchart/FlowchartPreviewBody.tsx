
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
  const [cleaned, setCleaned] = useState<string>(code);
  
  // Clean the mermaid code by removing potentially problematic syntax
  useEffect(() => {
    if (!code) return;
    
    try {
      let cleanedCode = code;
      
      // Fix common syntax issues that cause parsing errors
      // 1. Remove parentheses in node labels that aren't properly quoted
      cleanedCode = cleanedCode.replace(/\[([^\]]*\([^\)]*\)[^\]]*)\]/g, (match, p1) => {
        return `["${p1.replace(/"/g, '\\"')}"]`;
      });
      
      // 2. Ensure all node IDs don't have spaces or special characters
      const nodeIdRegex = /\s*([A-Za-z0-9_-]+)\s*-->/g;
      cleanedCode = cleanedCode.replace(nodeIdRegex, ' $1 -->');
      
      // 3. Ensure flowchart statement is properly formatted
      if (cleanedCode.includes('flowchart') && !cleanedCode.match(/flowchart\s+(TB|TD|BT|RL|LR)/)) {
        cleanedCode = cleanedCode.replace(/flowchart/, 'flowchart LR');
      }
      
      // 4. Ensure all edges are properly defined
      cleanedCode = cleanedCode.replace(/-->\s*$/gm, '--> id1');
      
      setCleaned(cleanedCode);
    } catch (err) {
      console.error("Error cleaning mermaid code:", err);
      setCleaned(code); // Fall back to original code
    }
  }, [code]);
  
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
      code={cleaned}
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
