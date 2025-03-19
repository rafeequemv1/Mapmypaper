
import { useEffect } from "react";
import mermaid from "mermaid";

const useMermaidInit = () => {
  useEffect(() => {
    // Initialize mermaid with specific configuration
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      logLevel: "error",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
      fontFamily: "Inter, sans-serif",
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        boxMargin: 10,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
      },
    });
    
    return () => {
      // Cleanup function
      cleanup();
    };
  }, []);
  
  // Explicit cleanup function
  const cleanup = () => {
    try {
      // Reset any mermaid global state
      const mermaidAny = mermaid as any;
      if (typeof mermaidAny.reset === 'function') {
        mermaidAny.reset();
      }
      
      // Clean up any orphaned SVG elements
      try {
        const mermaidSvgs = document.querySelectorAll('[id^="mermaid-"]');
        mermaidSvgs.forEach(svg => {
          if (svg.parentNode) {
            svg.parentNode.removeChild(svg);
          }
        });
        
        // Also look for flowchart SVGs
        const flowchartSvgs = document.querySelectorAll('[id^="flowchart-"]');
        flowchartSvgs.forEach(svg => {
          if (svg.parentNode) {
            svg.parentNode.removeChild(svg);
          }
        });
      } catch (err) {
        console.error("Error removing mermaid SVGs:", err);
      }
    } catch (error) {
      console.error("Error in mermaid cleanup:", error);
    }
  };
  
  return { cleanup };
};

export default useMermaidInit;
