
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
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
    
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
        // Remove all mermaid-related SVGs
        const selectors = [
          '[id^="mermaid-"]',
          '[id^="flowchart-"]',
          '.mermaid svg'
        ];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            try {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
            } catch (err) {
              console.error(`Error removing element with selector ${selector}:`, err);
            }
          });
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
