
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
  renderAttempt?: number;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  code,
  theme,
  isGenerating,
  error,
  zoomLevel,
  previewRef,
  renderAttempt = 0
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = previewRef || localRef;
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderIdRef = useRef<string>(`diagram-${Date.now()}-${renderAttempt}`);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  
  // Reset component state when code changes
  useEffect(() => {
    setRenderError(null);
    retryCountRef.current = 0;
    renderIdRef.current = `diagram-${Date.now()}-${renderAttempt}`;
  }, [code, renderAttempt]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error || !mountedRef.current) return;

      setIsRendering(true);
      setRenderError(null);
      
      // Clear previous content and recreate the container
      if (ref.current) {
        ref.current.innerHTML = '<div class="mermaid-container"></div>';
      }
      
      try {
        if (ref.current && mountedRef.current) {
          const container = ref.current.querySelector('.mermaid-container');
          if (!container) throw new Error("Container element not found");
          
          // Generate a unique ID for each render attempt
          renderIdRef.current = `diagram-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          
          // Configure mermaid with the current theme and options
          try {
            await mermaid.initialize({
              theme: theme,
              securityLevel: 'loose',
              startOnLoad: false,
              flowchart: {
                htmlLabels: true,
                useMaxWidth: true,
              },
              er: { useMaxWidth: true },
              sequence: { useMaxWidth: true },
              mindmap: { useMaxWidth: true },
              logLevel: 3 // Reduce log verbosity
            });
          } catch (initError) {
            console.warn("Mermaid initialization warning, proceeding anyway:", initError);
          }
          
          const attemptRender = async (attempt = 0): Promise<void> => {
            try {
              // If we're not mounted anymore, don't continue
              if (!mountedRef.current) return;
              
              console.log(`Rendering attempt ${attempt + 1} for diagram ${renderIdRef.current}`);
              
              const { svg } = await mermaid.render(renderIdRef.current, code, container);
              
              if (!mountedRef.current) return;
              
              if (ref.current && mountedRef.current) {
                ref.current.innerHTML = svg;
                const svgElement = ref.current.querySelector('svg');
                if (svgElement) {
                  // Apply SVG styling and adjustments
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
                  
                  // Add custom styles to the diagram
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
                    .mindmap-node > rect, .mindmap-node > circle, .mindmap-node > ellipse {
                      rx: 10px;
                      ry: 10px;
                      fill-opacity: 0.8 !important;
                    }
                    .mindmap-node text {
                      font-weight: 500;
                    }
                    .edgeLabel {
                      background-color: white;
                      border-radius: 8px;
                      padding: 4px 8px;
                      font-size: 12px;
                      font-weight: 500;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .flowchart-link, .mindmap-edge {
                      stroke-width: 2px !important;
                    }
                  `;
                  svgElement.appendChild(styleElement);
                }
              }
            } catch (renderError) {
              console.warn(`Mermaid render attempt ${attempt + 1} failed:`, renderError);
              
              if (attempt < maxRetries && mountedRef.current) {
                // Wait a bit longer each retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(1.5, attempt)));
                return attemptRender(attempt + 1);
              }
              
              console.error('Mermaid render error after retries, using fallback:', renderError);
              if (mountedRef.current) {
                setRenderError('fallback');
              }
            }
          };
          
          // Start the render attempt chain
          await attemptRender();
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

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      renderDiagram();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [code, theme, isGenerating, error, zoomLevel, ref, renderAttempt]);

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
