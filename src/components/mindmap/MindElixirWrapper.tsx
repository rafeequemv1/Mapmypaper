
import React, { useEffect, useRef } from 'react';
import MindElixir from 'mind-elixir';

// Define types for our props
interface MindElixirWrapperProps {
  options: any;
  onMindMapReady: (mindMap: any) => void;
  setLoadingMindmap: (loading: boolean) => void;
}

const MindElixirWrapper: React.FC<MindElixirWrapperProps> = ({ 
  options, 
  onMindMapReady, 
  setLoadingMindmap 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<any>(null);

  useEffect(() => {
    // We need to wait until the DOM element is actually rendered
    if (containerRef.current) {
      try {
        // Use the containerRef's id instead of trying to find '#mindmap' in the document
        const updatedOptions = {
          ...options,
          el: containerRef.current // Use the actual DOM node instead of a selector
        };

        // Initialize MindElixir with the DOM element
        const mind = new MindElixir(updatedOptions);
        mind.init();
        
        // Save the instance for cleanup
        mindElixirRef.current = mind;
        
        // Let parent component know mind map is ready
        console.log("Mind map loaded:", mind);
        onMindMapReady(mind);
        setLoadingMindmap(false);
      } catch (error) {
        console.error("Error initializing MindElixir:", error);
        setLoadingMindmap(false);
      }
    }

    return () => {
      // Clean up MindElixir instance when component unmounts
      if (mindElixirRef.current) {
        // Add cleanup if MindElixir provides a destroy method
        // mindElixirRef.current.destroy();
      }
    };
  }, [options, onMindMapReady, setLoadingMindmap]);

  return (
    <div ref={containerRef} className="h-full" style={{ overflow: 'hidden' }}></div>
  );
};

export default MindElixirWrapper;
