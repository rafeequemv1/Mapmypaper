
import React, { useEffect, useRef } from "react";
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

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current || !code || isGenerating || error) return;

      try {
        ref.current.innerHTML = "";

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
            logLevel: 1
          });
        } catch (initError) {
          console.warn("Mermaid initialization warning:", initError);
        }

        // Preprocessing code: LR direction and color classes
        let processedCode = code;
        if (processedCode.trim().startsWith('flowchart') && !processedCode.trim().startsWith('flowchart LR')) {
          processedCode = processedCode.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
        }

        if (processedCode.includes('flowchart') && !processedCode.includes('class') && !processedCode.includes('style')) {
          const lines = processedCode.split('\n');
          let nodeCount = 0;
          const nodeClass: Record<string, string> = {};

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
      } catch (err: any) {
        console.error('Error rendering diagram:', err);
        if (ref.current) {
          ref.current.innerHTML = `<div class="text-red-500 p-4">Error rendering diagram: ${err.message || 'Unknown error'}</div>`;
        }
      }
    };

    renderDiagram();
  }, [code, theme, isGenerating, error, zoomLevel, ref]);

  return (
    <div className="mermaid-diagram w-full h-full flex items-center justify-center" ref={ref} />
  );
};

export default FlowchartSVGRenderer;
