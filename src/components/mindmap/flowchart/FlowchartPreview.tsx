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
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error) return;
      
      try {
        ref.current.innerHTML = "";
        
        // Enhanced configuration for more detailed and colorful diagrams
        mermaid.initialize({
          theme: theme,
          securityLevel: 'loose',
          startOnLoad: false,
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            diagramPadding: 20,
            nodeSpacing: 80,
            rankSpacing: 100,
            useMaxWidth: true,
          },
          mindmap: {
            padding: 20,
          }
        });
        
        let processedCode = code;
        if (processedCode.trim().startsWith('flowchart') && !processedCode.trim().startsWith('flowchart LR')) {
          processedCode = processedCode.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
        }
        
        // Add enhanced styling classes if they don't exist
        if (!processedCode.includes('classDef')) {
          processedCode += `
            classDef default fill:#E5DEFF,stroke:#8B5CF6,stroke-width:3px,rx:15px,ry:15px
            classDef primary fill:#D3E4FD,stroke:#3B82F6,stroke-width:3px,rx:15px,ry:15px
            classDef success fill:#F2FCE2,stroke:#22C55E,stroke-width:3px,rx:15px,ry:15px
            classDef warning fill:#FEF7CD,stroke:#F59E0B,stroke-width:3px,rx:15px,ry:15px
            classDef danger fill:#FFDEE2,stroke:#EF4444,stroke-width:3px,rx:15px,ry:15px
            classDef info fill:#FDE1D3,stroke:#F97316,stroke-width:3px,rx:15px,ry:15px
            classDef special fill:#F1F0FB,stroke:#D946EF,stroke-width:3px,rx:15px,ry:15px
          `;
        }

        const customStyles = `
          .flowchart-node rect, .flowchart-label rect {
            rx: 15px;
            ry: 15px;
            fill-opacity: 0.9 !important;
          }
          .node rect, .node circle, .node ellipse, .node polygon, .node path {
            stroke-width: 3px !important;
            rx: 15px;
            ry: 15px;
          }
          .edgeLabel {
            background-color: white;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .flowchart-link {
            stroke-width: 3px !important;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          #flowchart {
            font-family: system-ui, -apple-system, sans-serif;
          }
          .node text {
            font-size: 14px;
            font-weight: 500;
          }
          .label text {
            font-size: 14px;
            font-weight: 500;
          }
        `;
        
        const { svg } = await mermaid.render(`diagram-${Date.now()}`, processedCode);
        
        if (ref.current) {
          ref.current.innerHTML = svg;
          
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            svgElement.style.display = 'block';
            
            const viewBox = svgElement.getAttribute('viewBox');
            if (!viewBox) {
              const bbox = (svgElement as SVGSVGElement).getBBox();
              svgElement.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
            }
            
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = customStyles;
            svgElement.appendChild(styleElement);
            
            // Apply zoom level
            if (zoomLevel !== 1) {
              const g = svgElement.querySelector('g');
              if (g) {
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                  const [x, y, width, height] = viewBox.split(' ').map(Number);
                  const centerX = width / 2;
                  const centerY = height / 2;
                  g.setAttribute('transform', 
                    `translate(${centerX * (1 - zoomLevel)},${centerY * (1 - zoomLevel)}) scale(${zoomLevel})`
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error rendering diagram:', err);
        if (ref.current) {
          ref.current.innerHTML = `<div class="text-red-500 p-4">Error rendering diagram: ${err.message || 'Unknown error'}</div>`;
        }
      }
    };
    
    renderDiagram();
  }, [code, theme, isGenerating, error, zoomLevel]);

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
          <pre className="whitespace-pre-wrap text-sm overflow-auto">{error}</pre>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 p-1 bg-white rounded-md border overflow-auto flex items-center justify-center">
      <div ref={ref} className="mermaid-diagram w-full h-full flex items-center justify-center" />
    </div>
  );
};

export default FlowchartPreview;
