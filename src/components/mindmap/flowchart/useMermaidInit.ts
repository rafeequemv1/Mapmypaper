
import { useEffect } from "react";
import mermaid from "mermaid";

export const useMermaidInit = () => {
  // Initialize mermaid with safe configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      },
      logLevel: 3 // Enables warning logs for debugging
    });
  }, []);
};

export default useMermaidInit;
