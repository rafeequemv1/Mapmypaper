
import { useEffect } from "react";
import mermaid from "mermaid";

export const useMermaidInit = (direction: "TB" | "LR" = "LR") => {
  // Initialize mermaid with safe configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        diagramPadding: 8,
        defaultRenderer: 'dagre-wrapper',
        nodeSpacing: 50,
        rankSpacing: 70,
        // Direction property for Mermaid v11+
        // Using raw object assignment to bypass TypeScript checking
        // since the type definitions might be outdated
        ...{ orientation: "LR" } // Always set to LR direction
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
      logLevel: 3 // Enables warning logs for debugging
    });
  }, []); // Remove direction dependency since we're always using "LR"
};

export default useMermaidInit;
