
import { useEffect, useRef, RefObject } from "react";
import mermaid from "mermaid";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: RefObject<HTMLDivElement>;
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
  zoomLevel = 1
}: FlowchartPreviewProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = previewRef || localRef;
  
  // Render mermaid diagram when code or theme changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error) return;
      
      try {
        // Clear previous content
        ref.current.innerHTML = "";
        
        // Set theme and configure for left-to-right layout with rounded nodes
        mermaid.initialize({
          theme: theme,
          securityLevel: 'loose',
          startOnLoad: false, // Prevent automatic rendering
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            diagramPadding: 8,
            nodeSpacing: 50,
            rankSpacing: 70,
            useMaxWidth: false
          }
        });
        
        // Add custom styling for rounded corners and light colors
        const customStyles = `
          .flowchart-node rect, .flowchart-label rect {
            rx: 15px;
            ry: 15px;
            fill-opacity: 0.7 !important;
          }
          .flowchart-node .label {
            font-size: 14px;
          }
          .edgeLabel {
            background-color: white;
            border-radius: 4px;
            padding: 2px;
            font-size: 12px;
          }
          .node-circle {
            fill-opacity: 0.7 !important;
          }
        `;
        
        // Directly render to the element itself rather than creating a new element
        const { svg } = await mermaid.render(`diagram-${Date.now()}`, code);
        
        if (ref.current) { // Check again in case component unmounted during async operation
          ref.current.innerHTML = svg;
          
          // Add zoom and pan functionality
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            
            // Add custom styles to SVG
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = customStyles;
            svgElement.appendChild(styleElement);
            
            // Apply zoom level
            if (zoomLevel !== 1) {
              const g = svgElement.querySelector('g');
              if (g) {
                // Get SVG dimensions
                const svgWidth = svgElement.viewBox.baseVal.width;
                const svgHeight = svgElement.viewBox.baseVal.height;
                
                // Calculate center point
                const centerX = svgWidth / 2;
                const centerY = svgHeight / 2;
                
                // Apply transform for zooming centered on the middle
                g.setAttribute('transform', 
                  `translate(${centerX * (1 - zoomLevel)},${centerY * (1 - zoomLevel)}) scale(${zoomLevel})`
                );
              }
            }
            
            // Fit SVG to container
            const viewBox = svgElement.getAttribute('viewBox')?.split(' ');
            if (viewBox && viewBox.length === 4) {
              const width = parseFloat(viewBox[2]);
              const height = parseFloat(viewBox[3]);
              const aspectRatio = width / height;
              
              // Set dimensions to maintain aspect ratio
              svgElement.style.width = '100%';
              svgElement.style.height = `${100 / aspectRatio}%`;
              svgElement.style.maxHeight = '100%';
            }
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
  }, [code, theme, isGenerating, error, zoomLevel]);
  
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
