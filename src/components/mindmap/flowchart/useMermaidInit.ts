
import { useEffect } from "react";
import mermaid from "mermaid";
import { useToast } from "@/hooks/use-toast";

const useMermaidInit = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    try {
      // Initialize mermaid with custom configuration
      mermaid.initialize({
        securityLevel: 'loose',
        startOnLoad: true,
        theme: 'forest',
        logLevel: 'error',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true
        },
        sequence: {
          showSequenceNumbers: false,
          actorMargin: 80,
          boxMargin: 20
        },
        mindmap: {
          padding: 16
        },
        er: {
          layoutDirection: 'TB'
        }
      });
    } catch (error) {
      console.error("Failed to initialize Mermaid:", error);
      toast({
        title: "Diagram Initialization Error",
        description: "Failed to initialize diagram renderer. Try refreshing the page.",
        variant: "destructive"
      });
    }
  }, [toast]);
};

export default useMermaidInit;
