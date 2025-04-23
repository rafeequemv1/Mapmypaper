
import React from "react";
import DiagramRenderer from "./DiagramRenderer";

interface FlowchartSVGRendererProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  isGenerating: boolean;
  error: string | null;
  zoomLevel: number;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const FlowchartSVGRenderer: React.FC<FlowchartSVGRendererProps> = ({
  code,
  theme,
  isGenerating,
  error,
  zoomLevel,
  previewRef
}) => {
  return (
    <DiagramRenderer
      code={code}
      theme={theme}
      isGenerating={isGenerating}
      error={error}
      zoomLevel={zoomLevel}
      previewRef={previewRef}
    />
  );
};

export default FlowchartSVGRenderer;
