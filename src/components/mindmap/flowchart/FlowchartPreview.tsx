
import { useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid';

export interface FlowchartPreviewProps {
  code: string;
  error?: string | null;
  isGenerating?: boolean;
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  hideEditor?: boolean; // Added hideEditor prop
}

const FlowchartPreview = ({ 
  code, 
  error, 
  isGenerating = false, 
  theme = 'default',
  previewRef,
  hideEditor = false // Default to false
}: FlowchartPreviewProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = previewRef || localRef;
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        if (ref.current) {
          ref.current.innerHTML = '';
          ref.current.removeAttribute('data-processed');
  
          // Configure mermaid
          mermaid.initialize({
            startOnLoad: false,
            theme: theme,
            securityLevel: 'loose',
            fontFamily: 'Roboto, sans-serif'
          });
          
          // Render the diagram
          const { svg } = await mermaid.render('mermaid-diagram', code);
          if (ref.current) {
            ref.current.innerHTML = svg;
            setRenderError(null);
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setRenderError(`Error rendering diagram: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    if (code && !isGenerating) {
      renderDiagram();
    }
  }, [code, isGenerating, theme, ref]);

  return (
    <div className="w-full h-full flex flex-col">
      {isGenerating ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-500">Generating diagram...</div>
        </div>
      ) : renderError ? (
        <div className="p-4 text-red-500 text-sm bg-red-50 rounded-md mb-4">
          {renderError}
        </div>
      ) : null}
      
      <div className="overflow-auto flex-1 flex items-center justify-center p-4">
        <div ref={ref} className="mermaid-diagram max-w-full"></div>
      </div>
    </div>
  );
};

export default FlowchartPreview;
