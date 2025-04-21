
import React from "react";
import FlowchartLoading from "./FlowchartLoading";
import FlowchartError from "./FlowchartError";
import FlowchartSVGRenderer from "./FlowchartSVGRenderer";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  hideEditor?: boolean;
  zoomLevel?: number;
}

const FlowchartPreview = ({
  code,
  error,
  isGenerating,
  theme,
  previewRef,
  hideEditor,
  zoomLevel = 1,
}: FlowchartPreviewProps) => {
  if (isGenerating) {
    return <FlowchartLoading />;
  }
  if (error) {
    return <FlowchartError error={error} />;
  }
  return (
    <div className="flex-1 p-1 bg-white rounded-md border overflow-auto flex items-center justify-center">
      <FlowchartSVGRenderer
        code={code}
        error={error}
        isGenerating={isGenerating}
        theme={theme}
        previewRef={previewRef}
        zoomLevel={zoomLevel}
      />
    </div>
  );
};

export default FlowchartPreview;
