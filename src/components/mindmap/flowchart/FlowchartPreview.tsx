
import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { Skeleton } from "@/components/ui/skeleton";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  hideEditor?: boolean;
  fitGraph?: boolean;
}

const FlowchartPreview = ({
  code,
  error,
  isGenerating,
  theme = 'default',
  previewRef,
  hideEditor = false,
  fitGraph = false
}: FlowchartPreviewProps) => {
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // Format the code with theme
  const getFormattedCode = (): string => {
    if (!code) return '';
    
    // Add theme directive if not present
    if (!code.includes('%%{init:')) {
      const fitProp = fitGraph ? ', "fit": true' : '';
      return `%%{init: {'theme':'${theme}'${fitProp}} }%%\n${code}`;
    }
    
    // Replace existing theme
    return code.replace(
      /%%{init:\s*{[^}]*}%%/g, 
      `%%{init: {'theme':'${theme}'${fitGraph ? ", 'fit': true" : ""}} }%%`
    );
  };
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || isGenerating) {
        setRenderedSvg('');
        return;
      }
      
      try {
        // First clear any previous errors
        setRenderError(null);
        
        // Initialize Mermaid with the selected theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme,
          securityLevel: 'loose',
          fontSize: 16,
          logLevel: 5, // debug
          fontFamily: 'Roboto, sans-serif',
          flowchart: {
            diagramPadding: 8,
            htmlLabels: true,
            curve: 'basis',
          },
          mindmap: {
            padding: fitGraph ? 50 : 100,
            useMaxWidth: fitGraph
          }
        });
        
        const formattedCode = getFormattedCode();
        
        // Render the diagram
        const { svg } = await mermaid.render('mermaid-diagram', formattedCode);
        setRenderedSvg(svg);
      } catch (err) {
        console.error('Error rendering diagram:', err);
        setRenderError(`Failed to render diagram: ${err instanceof Error ? err.message : String(err)}`);
        setRenderedSvg('');
      }
    };
    
    renderDiagram();
  }, [code, isGenerating, theme, fitGraph]);

  return (
    <div className="h-full flex flex-col">
      {/* Preview area */}
      <div 
        ref={previewRef}
        className="flex-1 flex flex-col items-center justify-center bg-white p-4 overflow-auto"
        style={{ minHeight: hideEditor ? '80vh' : '300px' }}
      >
        {isGenerating ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Skeleton className="w-[600px] h-[400px] mb-4 mx-auto rounded-md" />
              <p className="text-gray-500">Generating mindmap...</p>
            </div>
          </div>
        ) : renderError || error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded border border-red-200 w-full">
            <h3 className="font-semibold mb-2">Error</h3>
            <pre className="whitespace-pre-wrap overflow-auto max-h-[300px] text-sm">
              {renderError || error}
            </pre>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        )}
      </div>
    </div>
  );
};

export default FlowchartPreview;
