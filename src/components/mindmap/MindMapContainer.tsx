
import { useEffect, useRef, useState } from "react";
import { MindElixirInstance } from "mind-elixir";
import { initializeMindMap, calculateMindMapScale } from "./mindMapUtils";
import KeyboardShortcutsTooltip from "./KeyboardShortcutsTooltip";

interface MindMapContainerProps {
  isMapGenerated: boolean;
}

const MindMapContainer = ({ isMapGenerated }: MindMapContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map
      const mind = initializeMindMap(containerRef.current, (instance) => {
        mindMapRef.current = instance;
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
  }, [isMapGenerated]);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-[calc(100vh-100px)] bg-card overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#f5f5f5' }}
        />
        
        {/* Keyboard shortcuts tooltip */}
        <KeyboardShortcutsTooltip isVisible={isReady} />
        
        <div className="text-center p-1 text-xs text-muted-foreground absolute bottom-0 left-0 right-0 bg-background/80">
          Right-click on a node to open the context menu with options. You can also drag to pan, use mouse wheel to zoom.
        </div>
      </div>
    </div>
  );
};

export default MindMapContainer;
