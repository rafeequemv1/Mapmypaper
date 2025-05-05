
import { useState, useCallback } from "react";
import { MindElixirInstance } from "mind-elixir";
import React from "react";

interface UseGenerateMindMapProps {
  onMindMapReady?: (instance: MindElixirInstance) => void;
}

export function useGenerateMindMap({ onMindMapReady }: UseGenerateMindMapProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Create a function component instead of inline JSX
  const MindMapComponent = useCallback(() => {
    // Return a React functional component
    return function MockMindMapComponent() {
      return React.createElement(
        "div",
        { className: "w-full h-full flex items-center justify-center" },
        React.createElement(
          "div",
          { className: "text-gray-500" },
          "Mind map will be displayed here"
        )
      );
    };
  }, []);

  const handlePdfLoaded = useCallback(() => {
    setIsGenerating(true);
    
    // Simulate loading time for mind map generation
    const timeout = setTimeout(() => {
      setIsGenerating(false);
      
      // If we had a real mind map instance, we would call onMindMapReady here
      if (onMindMapReady) {
        // For now we pass a mock object
        onMindMapReady({} as MindElixirInstance);
      }
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [onMindMapReady]);

  return {
    isGenerating,
    handlePdfLoaded,
    MindMapComponent
  };
}
