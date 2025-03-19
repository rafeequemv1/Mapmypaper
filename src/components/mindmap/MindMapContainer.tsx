
import { useRef } from "react";
import { MindElixirInstance } from "mind-elixir";
import KeyboardShortcutsTooltip from "./KeyboardShortcutsTooltip";
import { useMindMapInitializer } from "@/hooks/useMindMapInitializer";

interface MindMapContainerProps {
  isMapGenerated: boolean;
}

const MindMapContainer = ({ isMapGenerated }: MindMapContainerProps) => {
  // Use mutable ref object pattern instead of RefObject to allow setting current
  const containerRef = useRef<HTMLDivElement>(null);
  // Create a mutable ref for mind map instance
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  
  const { isReady } = useMindMapInitializer(isMapGenerated, containerRef, mindMapRef);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-[calc(100vh-100px)] bg-card overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#f8f9fa' }}
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
