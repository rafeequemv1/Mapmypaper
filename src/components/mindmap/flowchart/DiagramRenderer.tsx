
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import FallbackDiagram from "./FallbackDiagram";

interface DiagramRendererProps {
  code: string;
  theme: 'default' | 'forest' | 'dark' | 'neutral';
  isGenerating: boolean;
  error: string | null;
  zoomLevel: number;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({
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
  const previousCodeRef = useRef<string>(code);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Check if code has changed to avoid unnecessary renders
    if (previousCodeRef.current === code && !isGenerating && ref.current && ref.current.querySelector('svg')) {
      return;
    }
    
    previousCodeRef.current = code;
    
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error || !mountedRef.current) return;

      setIsRendering(true);
      setRenderError(null);

      try {
        if (ref.current && mountedRef.current) {
          ref.current.innerHTML = '<div class="mermaid-container"></div>';
          const container = ref.current.querySelector('.mermaid-container');
          if (!container) throw new Error("Container element not found");
          renderIdRef.current = `diagram-${Date.now()}`;
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
            const { svg } = await mermaid.render(renderIdRef.current, code, container);
            if (ref.current && mountedRef.current) {
              ref.current.innerHTML = svg;
              const svgElement = ref.current.querySelector('svg');
              if (svgElement) {
                svgElement.setAttribute('width', '100%');
                svgElement.setAttribute('height', '100%');
                svgElement.style.maxWidth = '100%';
                svgElement.style.maxHeight = '100%';
                svgElement.style.display = 'block';
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
            if (
              renderError.toString().includes('dynamically imported') ||
              renderError.toString().includes('Failed to fetch')
            ) {
              if (mountedRef.current) {
                setRenderError('fallback');
              }
            } else {
              setRenderError(`Render error: ${renderError.toString()}`);
              if (mountedRef.current) {
                setRenderError('fallback');
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error rendering diagram:', err);
        setRenderError('fallback');
      } finally {
        if (mountedRef.current) {
          setIsRendering(false);
        }
      }
    };

    renderDiagram();
  }, [code, theme, isGenerating, error, zoomLevel, ref]);

  if (renderError === 'fallback') {
    return (
      <FallbackDiagram code={code} />
    );
  }

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

export default DiagramRenderer;
