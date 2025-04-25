
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface FlowchartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlowchartModal: React.FC<FlowchartModalProps> = ({ isOpen, onClose }) => {
  const flowchartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && flowchartRef.current) {
      try {
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          flowchart: {
            curve: 'basis',
            defaultRenderer: 'dagre-d3'
          },
          securityLevel: 'loose' // Add this to prevent security issues
        });

        const flowchartDefinition = `
          graph TD
            classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
            classDef process fill:#bbdefb,stroke:#1976d2,stroke-width:2px;
            classDef decision fill:#c8e6c9,stroke:#388e3c,stroke-width:2px;
            classDef endpoint fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px;

            A[Upload PDF] -->|Process| B(Extract Text)
            B --> C{Valid Content?}
            C -->|Yes| D[Generate Mind Map]
            C -->|No| E[Show Error]
            D --> F{User Input?}
            F -->|Edit| G[Update Mind Map]
            F -->|Export| H[Download Options]
            G --> F
            H -->|SVG| I[Save SVG]
            H -->|PNG| J[Save PNG]
            H -->|JSON| K[Save JSON]

            class A,B,D,E,G,I,J,K process;
            class C,F decision;
            class H endpoint;
        `;

        // Clear previous content
        if (flowchartRef.current) {
          flowchartRef.current.innerHTML = '';
        }

        // Use a setTimeout to ensure the DOM is ready
        setTimeout(() => {
          if (flowchartRef.current) {
            console.log("Rendering mermaid chart");
            mermaid.render('flowchart', flowchartDefinition).then(({ svg }) => {
              if (flowchartRef.current) {
                flowchartRef.current.innerHTML = svg;
                console.log("Mermaid chart rendered successfully");
              }
            }).catch(error => {
              console.error("Mermaid render error:", error);
              if (flowchartRef.current) {
                flowchartRef.current.innerHTML = `<div class="text-red-500">Error rendering flowchart: ${error.message}</div>`;
              }
            });
          }
        }, 100);
      } catch (error) {
        console.error("Mermaid initialization error:", error);
        if (flowchartRef.current) {
          flowchartRef.current.innerHTML = `<div class="text-red-500">Error initializing flowchart</div>`;
        }
      }
    }
  }, [isOpen]);

  const handleDownloadSVG = () => {
    const svg = flowchartRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mindmap-flow.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Mind Map Flow</DialogTitle>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Mind Map Flow</h2>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadSVG}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download SVG
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div 
          id="flowchart-container"
          ref={flowchartRef} 
          className="flex-1 overflow-auto bg-white p-4 rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

export default FlowchartModal;
