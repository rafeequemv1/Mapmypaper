
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface FlowchartSVGRendererProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  isGenerating: boolean;
  error: string | null;
  zoomLevel: number;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const FlowchartSVGRenderer: React.FC<FlowchartSVGRendererProps> = ({
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
  const renderIdRef = useRef<string>(`diagram-${Date.now()}`);
  const mountedRef = useRef(true);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error || !mountedRef.current) return;

      setIsRendering(true);
      setRenderError(null);

      try {
        // Safely clear the container before rendering
        if (ref.current && mountedRef.current) {
          // Create a fresh container to avoid DOM removal conflicts
          ref.current.innerHTML = '<div class="mermaid-container"></div>';
          const container = ref.current.querySelector('.mermaid-container');
          
          if (!container) {
            throw new Error("Container element not found");
          }

          // Generate a new unique ID for each render to avoid conflicts
          renderIdRef.current = `diagram-${Date.now()}`;

          // Attempt to initialize with basic settings that don't require dynamic imports
          try {
            mermaid.initialize({
              theme: theme,
              securityLevel: 'loose',
              startOnLoad: false,
              flowchart: {
                htmlLabels: true,
                useMaxWidth: true,
              },
              logLevel: 5
            });
          } catch (initError) {
            console.warn("Mermaid initialization warning, proceeding anyway:", initError);
          }

          try {
            // Use a simpler syntax for the first attempt to reduce chance of module loading errors
            const { svg } = await mermaid.render(renderIdRef.current, code, container);
            
            // If we got here, rendering worked
            if (ref.current && mountedRef.current) {
              // Replace the container with the rendered SVG instead of manipulating existing DOM
              ref.current.innerHTML = svg;

              const svgElement = ref.current.querySelector('svg');
              if (svgElement) {
                // Apply basic sizing
                svgElement.setAttribute('width', '100%');
                svgElement.setAttribute('height', '100%');
                svgElement.style.maxWidth = '100%';
                svgElement.style.maxHeight = '100%';
                svgElement.style.display = 'block';

                // Apply zoom if needed
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

                // Add custom styles directly to the SVG
                const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                styleElement.textContent = `
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
                svgElement.appendChild(styleElement);
              }
            }
          } catch (renderError) {
            console.error('Mermaid render error, trying fallback rendering:', renderError);
            
            // If dynamic import failed, use fallback rendering with basic SVG
            if (renderError.toString().includes('dynamically imported') || 
                renderError.toString().includes('Failed to fetch')) {
              
              // Simple SVG fallback that doesn't rely on mermaid diagrams
              if (mountedRef.current) {
                createFallbackDiagram(code);
              }
            } else {
              // Other rendering errors
              setRenderError(`Render error: ${renderError.toString()}`);
              if (mountedRef.current) {
                createFallbackDiagram(code);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error rendering diagram:', err);
        setRenderError(err.message || 'Unknown error rendering diagram');
        if (mountedRef.current) {
          createFallbackDiagram(code);
        }
      } finally {
        if (mountedRef.current) {
          setIsRendering(false);
        }
      }
    };

    const createFallbackDiagram = (code: string) => {
      if (!ref.current || !mountedRef.current) return;
      
      try {
        // Create a simple SVG fallback that represents the flowchart structure
        // Extract nodes and connections from the mermaid code
        const nodeMatches = code.match(/([A-Za-z0-9_-]+)(?:\[|\(|\{)/g) || [];
        const connections = code.match(/([A-Za-z0-9_-]+)\s*-->\s*([A-Za-z0-9_-]+)/g) || [];
        
        // Simple flowchart as SVG
        const nodes = Array.from(new Set(nodeMatches.map(n => n.replace(/[\[\(\{]$/, ''))));
        
        // Create the SVG container - replacing instead of modifying to avoid DOM conflicts
        if (ref.current && mountedRef.current) {
          ref.current.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
                </marker>
              </defs>
              <g transform="translate(50, 50)">
                ${nodes.map((node, i) => `
                  <g transform="translate(${(i % 3) * 260}, ${Math.floor(i / 3) * 100})">
                    <rect width="200" height="60" rx="15" ry="15" 
                      fill="${['#F2FCE2', '#FEF7CD', '#E5DEFF', '#D3E4FD', '#FDE1D3'][i % 5]}" 
                      stroke="${['#22C55E', '#F59E0B', '#8B5CF6', '#3B82F6', '#F97316'][i % 5]}" 
                      stroke-width="2" />
                    <text x="100" y="35" text-anchor="middle" font-family="Arial" font-size="14">${node}</text>
                  </g>
                `).join('')}
              </g>
              <text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold">
                Simplified Flowchart (Fallback Mode)
              </text>
              ${renderError ? `
                <text x="400" y="570" text-anchor="middle" font-family="Arial" font-size="14" fill="#EF4444">
                  Note: Using simplified view due to rendering issues
                </text>
              ` : ''}
            </svg>
          `;
        }
      } catch (fallbackError) {
        console.error('Fallback diagram creation failed:', fallbackError);
        if (ref.current && mountedRef.current) {
          ref.current.innerHTML = `
            <div class="p-4 text-center">
              <h3 class="text-lg font-medium mb-2">Unable to render flowchart</h3>
              <p class="text-sm text-gray-600">Try refreshing or using a simpler flowchart structure.</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
    
    // No DOM cleanup in the effect return function to prevent the "removeChild" error
  }, [code, theme, isGenerating, error, zoomLevel, ref]);

  return (
    <div className="mermaid-diagram w-full h-full flex items-center justify-center" ref={ref}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 mb-4"></div>
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowchartSVGRenderer;
