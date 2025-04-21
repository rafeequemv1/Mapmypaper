
import React from "react";
import FlowchartSVGRenderer from "./FlowchartSVGRenderer";
import FlowchartLoading from "./FlowchartLoading";
import FlowchartError from "./FlowchartError";
import RateLimitMessage from "./RateLimitMessage";

interface FlowchartPreviewBodyProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  zoomLevel?: number;
  onRetry?: () => void;
}

const FlowchartPreviewBody = ({
  code,
  error,
  isGenerating,
  theme,
  previewRef,
  zoomLevel = 1,
  onRetry
}: FlowchartPreviewBodyProps) => {
  const isRateLimitError = error?.includes('429') || error?.includes('rate limit') || error?.includes('quota exceeded');

  if (isGenerating) {
    return <FlowchartLoading />;
  }

  if (error) {
    if (isRateLimitError && onRetry) {
      return <RateLimitMessage onRetry={onRetry} isRetrying={false} />;
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
    />
  );
};

export default FlowchartPreviewBody;
