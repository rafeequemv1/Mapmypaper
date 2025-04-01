
import { useEffect } from "react";
import mermaid from "mermaid";

export const useMermaidInit = (direction: "TB" | "LR" = "TB") => {
  // Initialize mermaid with safe configuration
  useEffect(() => {
    // Initialize with base configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        diagramPadding: 8,
        nodeSpacing: 50,
        rankSpacing: 70,
        // Set orientation directly in flowchart config
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
      // Add our custom mindmap config (mermaid will ignore extra properties)
      // TypeScript doesn't know about this yet
      logLevel: 3 // Enables warning logs for debugging
    });
    
    // Explicitly set the direction/orientation in the flowchart config
    // by re-initializing with updated config that focuses just on the orientation
    mermaid.initialize({
      flowchart: {
        orientation: direction,
        curve: 'basis',
        useMaxWidth: false,
        htmlLabels: true,
      }
    });
    
  }, [direction]);
};

export default useMermaidInit;
