
import React from "react";
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
  return (
    <FlowchartPreviewContainer>
      <FlowchartPreviewBody
        code={code}
        error={error}
        isGenerating={isGenerating}
        theme={theme}
        previewRef={previewRef}
        zoomLevel={zoomLevel}
        onRetry={onRetry}
      />
    </FlowchartPreviewContainer>
  );
};

export default FlowchartPreview;
