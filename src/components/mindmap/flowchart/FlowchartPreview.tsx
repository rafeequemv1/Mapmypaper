
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
        
        // Initialize mermaid with safe configuration
        try {
          mermaid.initialize({
            theme: theme,
            securityLevel: 'loose',
            startOnLoad: false,
            flowchart: {
              htmlLabels: true,
              curve: 'basis',
              diagramPadding: 16,
              nodeSpacing: 60,
              rankSpacing: 80,
              useMaxWidth: true,
            },
            mindmap: {
              padding: 16,
            },
            logLevel: 1 // Set to lowest level to avoid unnecessary logs
          });
        } catch (initError) {
          console.warn("Mermaid initialization warning (may be already initialized):", initError);
          // Continue anyway as initialization might already have happened
        }
        
        let processedCode = code;
        if (processedCode.trim().startsWith('flowchart') && !processedCode.trim().startsWith('flowchart LR')) {
          processedCode = processedCode.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
        }
        
        if (processedCode.includes('flowchart') && !processedCode.includes('class') && !processedCode.includes('style')) {
          const lines = processedCode.split('\n');
          let nodeCount = 0;
          const nodeClass = {};
          
          for (let i = 0; i < lines.length; i++) {
            const nodeMatches = lines[i].match(/([A-Za-z0-9_-]+)(?:\[|\(|\{|\>)/g);
            if (nodeMatches) {
              for (const match of nodeMatches) {
                const nodeName = match.replace(/[\[\(\{\>]$/, '').trim();
                if (!nodeClass[nodeName] && nodeName !== 'flowchart') {
                  nodeClass[nodeName] = `class-${(nodeCount % 7) + 1}`;
                  nodeCount++;
                }
              }
            }
            
            const connMatches = lines[i].match(/([A-Za-z0-9_-]+)\s*-->/g);
            if (connMatches) {
              for (const match of connMatches) {
                const nodeName = match.replace(/\s*-->$/, '').trim();
                if (!nodeClass[nodeName]) {
                  nodeClass[nodeName] = `class-${(nodeCount % 7) + 1}`;
                  nodeCount++;
                }
              }
            }
          }
          
          for (const [node, className] of Object.entries(nodeClass)) {
            processedCode += `\nclass ${node} ${className}`;
          }
        }

        const customStyles = `
          .flowchart-node rect, .flowchart-label rect {
            rx: 15px;
            ry: 15px;
            fill-opacity: 0.8 !important;
          }
          .node rect, .node circle, .node ellipse, .node polygon, .node path {
            stroke-width: 2px !important;
            rx: 15px;
            ry: 15px;
          }
          .node.class-1 > rect { fill: #F2FCE2 !important; stroke: #22C55E !important; }
          .node.class-2 > rect { fill: #FEF7CD !important; stroke: #F59E0B !important; }
          .node.class-3 > rect { fill: #FDE1D3 !important; stroke: #F97316 !important; }
          .node.class-4 > rect { fill: #E5DEFF !important; stroke: #8B5CF6 !important; }
          .node.class-5 > rect { fill: #FFDEE2 !important; stroke: #EF4444 !important; }
          .node.class-6 > rect { fill: #D3E4FD !important; stroke: #3B82F6 !important; }
          .node.class-7 > rect { fill: #F1F0FB !important; stroke: #D946EF !important; }
          
          .edgeLabel {
            background-color: white;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .flowchart-link {
            stroke-width: 2px !important;
          }
        `;
        
        // We'll use a try-catch specifically for the rendering part
        try {
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
        } catch (renderError) {
          console.error('Mermaid render error:', renderError);
          // Fallback to showing just a simple diagram message
          if (ref.current) {
            ref.current.innerHTML = `
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f9f9f9"/>
                <text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle">
                  Unable to render diagram. Using simple flowchart.
                </text>
              </svg>
            `;
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
          <p className="mt-4 text-sm">Using default flowchart template instead.</p>
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
