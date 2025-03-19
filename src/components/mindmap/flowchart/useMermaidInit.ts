
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
    
    // Return cleanup function
    return () => {
      // Reset any global mermaid state that might persist
      try {
        // Clear any global mermaid caches or listeners
        // Using the any type to bypass TypeScript's type checking
        const mermaidAny = mermaid as any;
        if (typeof mermaidAny.reset === 'function') {
          mermaidAny.reset();
        }
      } catch (error) {
        console.error("Error cleaning up mermaid:", error);
      }
    };
  }, []);
  
  // Return a cleanup function that can be called explicitly
  const cleanup = () => {
    try {
      // Using the any type to bypass TypeScript's type checking
      const mermaidAny = mermaid as any;
      if (typeof mermaidAny.reset === 'function') {
        mermaidAny.reset();
      }
      
      // Force cleanup of any DOM elements created by mermaid
      const mermaidElements = document.querySelectorAll('.mermaid');
      mermaidElements.forEach(el => {
        // Remove any extra SVG elements added by mermaid
        const svgs = el.querySelectorAll('svg');
        svgs.forEach(svg => svg.remove());
      });
    } catch (error) {
      console.error("Error in mermaid cleanup:", error);
    }
  };
  
  return { cleanup };
};

export default useMermaidInit;
