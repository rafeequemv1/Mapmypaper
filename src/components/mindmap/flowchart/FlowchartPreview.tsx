
import { useEffect, useRef, RefObject } from "react";
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
      if (!ref.current || !code || isGenerating || error) return;
      
      try {
        // Clear previous content
        ref.current.innerHTML = "";
        
        // Set theme
        mermaid.initialize({
          theme: theme,
          securityLevel: 'loose',
          startOnLoad: false, // Prevent automatic rendering
        });
        
        // Directly render to the element itself rather than creating a new element
        const { svg } = await mermaid.render(`diagram-${Date.now()}`, code);
        
        if (ref.current) { // Check again in case component unmounted during async operation
          ref.current.innerHTML = svg;
          
          // Add zoom and pan functionality
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
          }
        }
      } catch (err) {
        console.error('Error rendering diagram:', err);
        if (ref.current) {
          ref.current.innerHTML = `<div class="text-red-500">Error rendering diagram: ${err.message || 'Unknown error'}</div>`;
        }
      }
    };
    
    renderDiagram();
  }, [code, theme, isGenerating, error]);
  
  // Display appropriate content based on state
  if (isGenerating) {
    return <div className="flex-1 flex items-center justify-center p-8">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-gray-300 mb-4"></div>
        <div className="h-4 w-48 bg-gray-300 rounded"></div>
      </div>
    </div>;
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
