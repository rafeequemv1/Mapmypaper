import React, { useEffect, useState } from "react";
import DiagramRenderer from "./DiagramRenderer";

interface FlowchartSVGRendererProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  isGenerating: boolean;
  error: string | null;
  zoomLevel: number;
  previewRef?: React.RefObject<HTMLDivElement>;
  renderAttempt?: number;
}

const FlowchartSVGRenderer: React.FC<FlowchartSVGRendererProps> = ({
  code,
  theme,
  isGenerating,
  error,
  zoomLevel,
  previewRef,
  renderAttempt = 0
}) => {
  const [mounted, setMounted] = useState(false);
  const [localRenderAttempt, setLocalRenderAttempt] = useState(renderAttempt);

  // Ensure component is mounted before attempting to render
  useEffect(() => {
    setMounted(true);
    
    // Force additional render attempts when component mounts
    const timer = setTimeout(() => {
      setLocalRenderAttempt(prev => prev + 1);
    }, 200);
    
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  // Cleanup Mermaid syntax issues
  const cleanMermaidCode = (code: string): string => {
    // Remove any invalid characters that might break Mermaid parsing
    let cleaned = code;
    
    // Replace invalid characters in node ids
    cleaned = cleaned.replace(/\(([^)]*)\)/g, (match, p1) => {
      // If the parentheses are within quotes, leave them
      if (match.startsWith('("') && match.endsWith('")')) {
        return match;
      }
      // Otherwise, replace parentheses with underscores
      return `_${p1.replace(/[()]/g, '_')}_`;
    });
    
    // Ensure there are line breaks between statements
    cleaned = cleaned.replace(/(\w+)\s+-->/g, '\n$1 -->');
    
    return cleaned;
  };

  // Only render when component is mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-primary/20 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-primary/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <DiagramRenderer
      code={cleanMermaidCode(code)}
      theme={theme}
      isGenerating={isGenerating}
      error={error}
      zoomLevel={zoomLevel}
      previewRef={previewRef}
      renderAttempt={localRenderAttempt}
    />
  );
};

export default FlowchartSVGRenderer;
