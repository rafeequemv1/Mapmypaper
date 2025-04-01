
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
    
    // For flowcharts, apply the direction through the general mermaid config
    // This avoids TypeScript errors with the flowchart config object
    if (direction === "LR") {
      // Force horizontal layout for flowcharts using the proper syntax that works with mermaid
      document.querySelectorAll('.mermaid').forEach(el => {
        if (el.textContent && el.textContent.trim().startsWith('flowchart')) {
          if (!el.textContent.includes('flowchart LR')) {
            el.textContent = el.textContent.replace(/flowchart\s+[A-Z]{2}/, 'flowchart LR');
          }
        }
      });
    }
    
  }, [direction]);
};

export default useMermaidInit;
