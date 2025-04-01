
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
  fitGraph = true // Default to true to ensure flowchart fits in modal
}: FlowchartPreviewProps) => {
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  
  // Format the code with theme and LR direction
  const getFormattedCode = (): string => {
    if (!code) return '';
    
    // Transform TD to LR if needed
    let formattedCode = code.replace(/flowchart\s+TD/i, 'flowchart LR');
    
    // Add theme directive if not present
    if (!formattedCode.includes('%%{init:')) {
      const fitProp = fitGraph ? ', "fit": true' : '';
      return `%%{init: {'theme':'${theme}'${fitProp}} }%%\n${formattedCode}`;
    }
    
    // Replace existing theme
    return formattedCode.replace(
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
        
        // Initialize Mermaid with the selected theme and appropriate settings
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
            useMaxWidth: false, // Set to false to allow full width
            rankSpacing: 50,
            nodeSpacing: 50,
            defaultRenderer: 'dagre-wrapper',
            // Add rounded corners to all nodes by default
            cornerRadius: 15
          },
          mindmap: {
            padding: 50,
            useMaxWidth: false
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

  // Add zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2)); // Max zoom 200%
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 50%
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Zoom controls */}
      {!isGenerating && renderedSvg && (
        <div className="flex justify-end mb-2 gap-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="Zoom out"
          >
            -
          </button>
          <button 
            onClick={handleResetZoom}
            className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={handleZoomIn}
            className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="Zoom in"
          >
            +
          </button>
        </div>
      )}
      
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
              <p className="text-gray-500">Generating diagram...</p>
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
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        )}
      </div>
    </div>
  );
};

export default FlowchartPreview;
