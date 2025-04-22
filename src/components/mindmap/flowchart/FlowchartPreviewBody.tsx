
import React from "react";
import FlowchartLoading from "./FlowchartLoading";
import FlowchartError from "./FlowchartError";
import FlowchartSVGRenderer from "./FlowchartSVGRenderer";

interface FlowchartPreviewBodyProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  zoomLevel?: number;
}

const FlowchartPreviewBody = ({
  code,
  error,
  isGenerating,
  theme,
  previewRef,
  zoomLevel = 1,
}: FlowchartPreviewBodyProps) => {
  if (isGenerating) {
    return <FlowchartLoading />;
  }
  if (error) {
    return <FlowchartError error={error} />;
  }
  return (
    <FlowchartSVGRenderer
      code={code}
      error={error}
      isGenerating={isGenerating}
      theme={theme}
      previewRef={previewRef}
      zoomLevel={zoomLevel}
    />
  );
};

export default FlowchartPreviewBody;
