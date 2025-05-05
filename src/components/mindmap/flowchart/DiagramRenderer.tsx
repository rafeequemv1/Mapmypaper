
import React, { useEffect, useRef, useState } from "react";
import FallbackDiagram from "./FallbackDiagram";

interface DiagramRendererProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  isGenerating: boolean;
  error: string | null;
  zoomLevel: number;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  code,
  theme,
  isGenerating,
  error,
  zoomLevel,
  previewRef
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = previewRef || localRef;
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    setIsRendering(false);
    setRenderError(null);
  }, [code]);

  // Simplified renderer just shows the fallback diagram
  return (
    <FallbackDiagram code={code} />
  );
};

export default DiagramRenderer;
