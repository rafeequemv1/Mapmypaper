
import { useEffect } from "react";
import mermaid from "mermaid";

export const useMermaidInit = (direction: "TB" | "LR" = "TB") => {
  // Initialize mermaid with safe configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        diagramPadding: 8,
        defaultRenderer: 'dagre-wrapper',
        nodeSpacing: 50,
        rankSpacing: 70,
        // Fix: In Mermaid 9.0.0+ we should set orientation in the flowchart config
        orientation: direction
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      mindmap: {
        padding: 16,
        useMaxWidth: false
      },
      treemap: {  // Add treemap (specialized mindmap) configuration
        padding: 16,
        useMaxWidth: false,
        nodeSpacing: 50
      },
      logLevel: 3 // Enables warning logs for debugging
    });
  }, [direction]);
};

export default useMermaidInit;
