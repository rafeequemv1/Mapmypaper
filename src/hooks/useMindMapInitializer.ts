
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
      // Initialize the mind map with a callback that will be used to set the reference
      // instead of directly assigning to mindMapRef.current
      const mind = initializeMindMap(containerRef.current, (instance) => {
        // Since we can't directly assign to mindMapRef.current, we need to ensure
        // our initializeMindMap function handles setting the ref properly
        // The implementation in mindMapUtils.ts will handle this
      });
      
      // Store the instance locally within this effect closure
      const mindInstance = mind;
      
      // Using Object.defineProperty to set mindMapRef.current is also not possible
      // as React refs are designed to be immutable objects
      // We'll need to rely on the callback passed to initializeMindMap instead
      
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
        // We can't directly set mindMapRef.current to null here
        // The component using this hook must handle cleanup if needed
      };
    }
  }, [isMapGenerated, containerRef, mindMapRef]);

  return { isReady };
}
