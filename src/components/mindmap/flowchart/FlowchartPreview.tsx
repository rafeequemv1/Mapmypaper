
import React, { useEffect, useState } from "react";
import FlowchartPreviewContainer from "./FlowchartPreviewContainer";
import FlowchartPreviewBody from "./FlowchartPreviewBody";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  hideEditor?: boolean;
  zoomLevel?: number;
  onRetry?: () => void;
}

const FlowchartPreview = ({
  code,
  error,
  isGenerating,
  theme,
  previewRef,
  zoomLevel = 1,
  onRetry,
}: FlowchartPreviewProps) => {
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is fully mounted before attempting to render flowchart
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  return (
    <FlowchartPreviewContainer>
      {mounted ? (
        <FlowchartPreviewBody
          code={code}
          error={error}
          isGenerating={isGenerating}
          theme={theme}
          previewRef={previewRef}
          zoomLevel={zoomLevel}
          onRetry={onRetry}
          retryCount={0}
          maxRetries={5} // Increased max retries
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full p-4">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-primary/20 rounded-full mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-primary/10 rounded mx-auto"></div>
          </div>
        </div>
      )}
    </FlowchartPreviewContainer>
  );
};

export default FlowchartPreview;
