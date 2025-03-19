
import { useEffect } from "react";
import mermaid from "mermaid";

const useMermaidInit = () => {
  useEffect(() => {
    try {
      // Reset mermaid before initializing
      if (typeof (mermaid as any).reset === 'function') {
        (mermaid as any).reset();
      }
      
      // Initialize mermaid with specific configuration
      mermaid.initialize({
        startOnLoad: false, // Changed to false to avoid automatic rendering
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
      
      console.log("Mermaid initialized successfully");
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
    
    return () => {
      // Cleanup function
      cleanup();
    };
  }, []);
  
  // Explicit cleanup function - modified to be less aggressive
  const cleanup = () => {
    try {
      // Reset mermaid global state
      const mermaidAny = mermaid as any;
      if (typeof mermaidAny.reset === 'function') {
        mermaidAny.reset();
      }
      
      // Only remove mermaid SVGs within the specific containers
      // This is the key change - we avoid removing elements that might be used elsewhere
      const modalContainers = document.querySelectorAll('[data-mermaid-container="true"]');
      modalContainers.forEach(container => {
        if (container) {
          try {
            // Instead of innerHTML='', find and remove only SVG elements to be more precise
            const svgElements = container.querySelectorAll('svg.mermaid-svg');
            svgElements.forEach(svg => svg.remove());
            
            console.log(`Cleaned up ${svgElements.length} mermaid SVGs`);
          } catch (err) {
            console.error("Error clearing mermaid container:", err);
          }
        }
      });
      
      console.log("Mermaid cleanup completed with limited scope");
    } catch (error) {
      console.error("Error in mermaid cleanup:", error);
    }
  };
  
  return { cleanup };
};

export default useMermaidInit;
