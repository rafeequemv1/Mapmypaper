
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
        // Get all SVG elements from the document
        const allSvgElements = document.querySelectorAll('svg');
        
        // Filter mermaid-related SVGs for removal
        const selectors = [
          '[id^="mermaid-"]',
          '[id^="flowchart-"]',
          '[id^="diagram-"]',
          '.mermaid svg'
        ];
        
        // Remove matching SVG elements
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
        
        // Also clean up any mermaid-related DOM elements by class
        const mermaidClasses = ['.mermaid', '.mermaid-parent', '.mermaid-wrapper'];
        mermaidClasses.forEach(cls => {
          document.querySelectorAll(cls).forEach(el => {
            // Clear the inner HTML rather than removing the element
            el.innerHTML = '';
          });
        });
        
        // Clean up remaining mermaid-generated elements by ID
        allSvgElements.forEach(svg => {
          const id = svg.id || '';
          if (id.startsWith('mermaid-') || id.startsWith('flowchart-') || id.startsWith('diagram-')) {
            try {
              if (svg.parentNode) {
                svg.parentNode.removeChild(svg);
              }
            } catch (err) {
              console.error(`Error removing SVG with ID ${id}:`, err);
            }
          }
        });

        // Clear any remaining mermaid-specific styles
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
          if (style.innerHTML.includes('mermaid') || style.innerHTML.includes('flowchart')) {
            try {
              if (style.parentNode) {
                style.parentNode.removeChild(style);
              }
            } catch (err) {
              console.error("Error removing mermaid style:", err);
            }
          }
        });
      } catch (err) {
        console.error("Error removing mermaid SVGs:", err);
      }

      // Attempt to reset event handlers
      try {
        const mermaidElements = document.querySelectorAll('.mermaid');
        mermaidElements.forEach(el => {
          // Clone and replace to remove event listeners
          const newEl = el.cloneNode(true);
          if (el.parentNode) {
            el.parentNode.replaceChild(newEl, el);
          }
        });
      } catch (cloneErr) {
        console.error("Error replacing mermaid elements:", cloneErr);
      }
    } catch (error) {
      console.error("Error in mermaid cleanup:", error);
    }
  };
  
  return { cleanup };
};

export default useMermaidInit;
