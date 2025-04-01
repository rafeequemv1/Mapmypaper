
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
    
    // Set direction separately since 'orientation' is not a valid property
    mermaid.flowchartConfig = { 
      ...mermaid.flowchartConfig,
      htmlLabels: true,
      curve: 'basis',
      useMaxWidth: false,
      defaultRenderer: 'dagre-wrapper'
    };
    
    // Set the graph direction using the API
    mermaid.updateConfig({
      flowchart: {
        defaultRenderer: 'dagre-wrapper',
        htmlLabels: true,
      }
    });
    
    // Set the direction using the proper method
    mermaid.flowchartConfig.rankDir = direction;
  }, [direction]);
};

export default useMermaidInit;
