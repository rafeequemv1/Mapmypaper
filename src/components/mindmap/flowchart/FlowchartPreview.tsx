
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface FlowchartPreviewProps {
  code: string;
  error: string | null;
  isGenerating: boolean;
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  previewRef?: React.RefObject<HTMLDivElement>;
  hideEditor?: boolean;
  fitGraph?: boolean;
}

const FlowchartPreview = ({
  code,
  error,
  isGenerating,
  theme = 'default',
  previewRef,
  hideEditor = false,
  fitGraph = false,
}: FlowchartPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  
  // Render the Mermaid diagram
  useEffect(() => {
    if (!code || error) return;
    
    const renderDiagram = async () => {
      if (containerRef.current) {
        try {
          // Clear existing content
          containerRef.current.innerHTML = '';
          
          // Create a unique ID for the diagram
          const id = `mermaid-diagram-${Date.now()}`;
          
          // Create container element
          const container = document.createElement('div');
          container.id = id;
          container.className = 'mermaid max-w-full';
          container.textContent = code;
          
          // Add to DOM
          containerRef.current.appendChild(container);
          
          // Configure Mermaid
          mermaid.initialize({
            startOnLoad: true,
            theme: theme,
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
            // Set diagram config
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis',
              // Use correct property for rounded corners
              diagramPadding: 8,
              nodeSpacing: 60,
              rankSpacing: 80,
            },
            // Add support for more diagram types
            sequence: {
              diagramMarginX: 50,
              diagramMarginY: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 35,
              mirrorActors: true
            },
            // Mindmap specific config
            mindmap: {
              padding: 20,
              // Remove the wrap property as it doesn't exist in MindmapDiagramConfig
              useMaxWidth: true,
            }
          });
          
          // Render the diagram
          await mermaid.run({
            nodes: [container]
          });
          
          // Apply fit-to-width if requested
          if (fitGraph) {
            const svg = containerRef.current.querySelector('svg');
            if (svg) {
              svg.style.width = '100%';
              svg.style.maxWidth = '100%';
              svg.style.height = 'auto';
              svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
          }
        } catch (err) {
          console.error('Error rendering Mermaid diagram:', err);
          
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="p-4 text-red-500 bg-red-50 rounded-md">
                <p class="font-medium">Error rendering diagram</p>
                <p class="text-sm">${err instanceof Error ? err.message : String(err)}</p>
              </div>
            `;
          }
        }
      }
    };
    
    renderDiagram();
  }, [code, theme, error, fitGraph]);
  
  // Spinner component for loading state
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-2" />
          <p className="text-gray-500">Generating diagram...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-700 font-medium mb-2">Error Generating Diagram</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Toggle button only if not hidden */}
      {!hideEditor && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(prev => !prev)}
          >
            {showCode ? 'Hide Code' : 'Edit Code'}
          </Button>
        </div>
      )}
      
      {/* Code editor if shown */}
      {showCode && !hideEditor && (
        <div className="border rounded-md mb-4 p-4 bg-gray-50">
          <textarea
            className="w-full h-[200px] font-mono text-sm bg-gray-50 border-none resize-none focus:outline-none focus:ring-0"
            value={code}
            readOnly
          />
        </div>
      )}
      
      {/* Preview area */}
      <div
        ref={(el) => {
          // Set both refs if previewRef is provided
          if (el) {
            containerRef.current = el;
            if (previewRef && 'current' in previewRef) {
              // Use type assertion to fix TypeScript error
              (previewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }
        }}
        className="flex-1 overflow-auto"
      />
    </div>
  );
};

export default FlowchartPreview;
