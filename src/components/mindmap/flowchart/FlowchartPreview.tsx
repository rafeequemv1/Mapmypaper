
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
        
        // Set theme and configure mermaid
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
            useMaxWidth: true, // Enable responsive diagrams
          },
          // Ensure mindmaps have proper layout
          mindmap: {
            padding: 10,
            // Fix: Remove maxWidth property as it's not in the MindmapDiagramConfig type
            useMaxWidth: true // This property is valid
          }
        });
        
        // Ensure flowcharts use LR direction by modifying the code if needed
        let processedCode = code;
        if (processedCode.trim().startsWith('flowchart') && !processedCode.trim().startsWith('flowchart LR')) {
          processedCode = processedCode.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
        }
        
        // Add custom styling for enhanced colors
        const customStyles = `
          .flowchart-node rect, .flowchart-label rect {
            rx: 15px;
            ry: 15px;
            fill-opacity: 0.8 !important;
          }
          .flowchart-node .label {
            font-size: 14px;
            font-weight: 500;
          }
          .edgeLabel {
            background-color: white;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .node-circle {
            fill-opacity: 0.8 !important;
          }
          .cluster rect {
            fill: #f1f5f9 !important;
            stroke: #cbd5e1 !important;
            rx: 5px;
            ry: 5px;
          }
          .cluster-label {
            font-weight: bold !important;
          }
          .node rect, .node circle, .node ellipse, .node polygon, .node path {
            stroke-width: 2px !important;
          }
          .flowchart-link {
            stroke-width: 2px !important;
          }
          .node.default > rect, .node.default > circle, .node.default > ellipse, .node.default > polygon {
            fill: #E5DEFF !important;
            stroke: #8B5CF6 !important;
          }
          .node.primary > rect, .node.primary > circle, .node.primary > ellipse, .node.primary > polygon {
            fill: #D3E4FD !important;
            stroke: #0EA5E9 !important;
          }
          .node.success > rect, .node.success > circle, .node.success > ellipse, .node.success > polygon {
            fill: #F2FCE2 !important;
            stroke: #22C55E !important;
          }
          .node.warning > rect, .node.warning > circle, .node.warning > ellipse, .node.warning > polygon {
            fill: #FEF7CD !important;
            stroke: #F59E0B !important;
          }
          .node.danger > rect, .node.danger > circle, .node.danger > ellipse, .node.danger > polygon {
            fill: #FFDEE2 !important;
            stroke: #EF4444 !important;
          }
          .node.info > rect, .node.info > circle, .node.info > ellipse, .node.info > polygon {
            fill: #D3E4FD !important;
            stroke: #3B82F6 !important;
          }
          .node.neutral > rect, .node.neutral > circle, .node.neutral > ellipse, .node.neutral > polygon {
            fill: #FDE1D3 !important;
            stroke: #F97316 !important;
          }
          .node.decision > path {
            fill: #E5DEFF !important;
            stroke: #8B5CF6 !important;
          }
          .node.start > circle {
            fill: #F2FCE2 !important;
            stroke: #22C55E !important;
          }
          .node.end > circle {
            fill: #FFDEE2 !important;
            stroke: #EF4444 !important;
          }
          
          /* Also apply these styles for mindmap nodes */
          .mindmap-node > rect, .mindmap-node > circle, .mindmap-node > ellipse, .mindmap-node > polygon {
            rx: 10px;
            ry: 10px;
            fill-opacity: 0.8 !important;
          }
          
          /* Make sure SVG is responsive */
          svg {
            max-width: 100% !important;
            height: auto !important;
            display: block;
            margin: 0 auto;
          }
        `;
        
        // Directly render to the element itself rather than creating a new element
        const { svg } = await mermaid.render(`diagram-${Date.now()}`, processedCode);
        
        if (ref.current) { // Check again in case component unmounted during async operation
          ref.current.innerHTML = svg;
          
          // Add zoom and pan functionality
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            // Make SVG responsive - force it to fill container while maintaining aspect ratio
            svgElement.setAttribute('width', '100%');
            svgElement.setAttribute('height', '100%');
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            svgElement.style.display = 'block';
            
            // Force the viewbox to ensure the diagram fits
            const viewBox = svgElement.getAttribute('viewBox');
            if (!viewBox) {
              const bbox = (svgElement as SVGSVGElement).getBBox();
              svgElement.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
            }
            
            // Add custom styles to SVG
            const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleElement.textContent = customStyles;
            svgElement.appendChild(styleElement);
            
            // Apply zoom level
            if (zoomLevel !== 1) {
              const g = svgElement.querySelector('g');
              if (g) {
                // Get SVG dimensions from viewBox
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                  const [x, y, width, height] = viewBox.split(' ').map(Number);
                  
                  // Calculate center point
                  const centerX = width / 2;
                  const centerY = height / 2;
                  
                  // Apply transform for zooming centered on the middle
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
