
import { useEffect, useRef, forwardRef, RefObject } from "react";
import mermaid from "mermaid";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: RefObject<HTMLDivElement>;
}

const FlowchartPreview = ({ code, error, isGenerating, theme, previewRef }: FlowchartPreviewProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = previewRef || localRef;
  
  // Render mermaid diagram when code or theme changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (ref.current && code && !isGenerating && !error) {
        try {
          // Clear previous content
          ref.current.innerHTML = "";
          
          // Set theme
          mermaid.initialize({
            theme: theme,
            securityLevel: 'loose',
          });
          
          // Render the diagram
          const { svg } = await mermaid.render('diagram', code);
          ref.current.innerHTML = svg;
          
          // Add zoom and pan functionality
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            // Optional: add zoom and pan functionality here if needed
          }
        } catch (err) {
          console.error('Error rendering diagram:', err);
          ref.current.innerHTML = `<div class="text-red-500">Error rendering diagram: ${err.message || 'Unknown error'}</div>`;
        }
      }
    };
    
    renderDiagram();
  }, [code, theme, isGenerating, error]);
  
  // Display appropriate content based on state
  if (isGenerating) {
    return <div className="flex-1 flex items-center justify-center">Generating diagram...</div>;
  }
  
  if (error) {
    return (
      <div className="flex-1 p-4 overflow-auto">
        <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
          <h3 className="font-bold mb-2">Error</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 p-6 bg-white rounded-md border overflow-auto flex items-center justify-center">
      <div ref={ref} className="mermaid-diagram w-full h-full flex items-center justify-center" />
    </div>
  );
};

export default FlowchartPreview;
