
import { useEffect, useState, RefObject, MutableRefObject } from "react";
import { MindElixirInstance } from "mind-elixir";
import { initializeMindMap, calculateMindMapScale } from "@/components/mindmap/mindMapUtils";

export function useMindMapInitializer(
  isMapGenerated: boolean,
  containerRef: RefObject<HTMLDivElement>,
  mindMapRef: MutableRefObject<MindElixirInstance | null>
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map with a callback that will be used to set the reference
      const mind = initializeMindMap(containerRef.current, (instance) => {
        // This callback will assign the instance to the ref
        mindMapRef.current = instance;
      });
      
      // Store the instance locally within this effect closure
      const mindInstance = mind;
      
      // Register event listeners for debugging
      mind.bus.addListener('operation', (operation: any) => {
        console.log('Mind map operation:', operation);
      });
      
      mind.bus.addListener('selectNode', (node: any) => {
        console.log('Node selected:', node);
      });
      
      // Function to fit the mind map within the container
      const fitMindMap = () => {
        if (!containerRef.current || !mindInstance) return;
        
        // Get the mind map's root element
        const mindMapRoot = mindInstance.container;
        if (!mindMapRoot) return;
        
        // Calculate the appropriate scale
        const scale = calculateMindMapScale(containerRef.current, mindMapRoot);
        
        // Apply scale and center using the local mindInstance
        mindInstance.scale(scale);
        mindInstance.toCenter();
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
        // Clean up mind map instance - ensure this is a MutableRefObject to allow assignment
        mindMapRef.current = null;
      };
    }
  }, [isMapGenerated, containerRef, mindMapRef]);

  return { isReady };
}
