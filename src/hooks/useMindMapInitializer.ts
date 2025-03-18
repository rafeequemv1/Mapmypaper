
import { useEffect, useState, RefObject } from "react";
import { MindElixirInstance } from "mind-elixir";
import { initializeMindMap, calculateMindMapScale } from "@/components/mindmap/mindMapUtils";

export function useMindMapInitializer(
  isMapGenerated: boolean,
  containerRef: RefObject<HTMLDivElement>,
  mindMapRef: RefObject<MindElixirInstance | null>
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map
      const mind = initializeMindMap(containerRef.current, (instance) => {
        if (mindMapRef.current !== instance) {
          mindMapRef.current = instance;
        }
      });
      
      // Register event listeners for debugging
      mind.bus.addListener('operation', (operation: any) => {
        console.log('Mind map operation:', operation);
      });
      
      mind.bus.addListener('selectNode', (node: any) => {
        console.log('Node selected:', node);
      });
      
      // Function to fit the mind map within the container
      const fitMindMap = () => {
        if (!containerRef.current || !mindMapRef.current) return;
        
        // Get the mind map's root element
        const mindMapRoot = mind.container;
        if (!mindMapRoot) return;
        
        // Calculate the appropriate scale
        const scale = calculateMindMapScale(containerRef.current, mindMapRoot);
        
        // Apply scale and center
        mindMapRef.current.scale(scale);
        mindMapRef.current.toCenter();
      };
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        fitMindMap();
        setIsReady(true);
      }, 300);
      
      // Log for debugging
      console.log("Mind Elixir initialized");
      
      // Add resize handler
      const handleResize = () => fitMindMap();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        mindMapRef.current = null;
      };
    }
  }, [isMapGenerated, containerRef, mindMapRef]);

  return { isReady };
}
