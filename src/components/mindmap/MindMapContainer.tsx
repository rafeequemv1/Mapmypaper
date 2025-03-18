
import { useRef, useState, useEffect } from "react";
import { MindElixirInstance } from "mind-elixir";
import KeyboardShortcutsTooltip from "./KeyboardShortcutsTooltip";
import { useMindMapInitializer } from "@/hooks/useMindMapInitializer";
import MindMapContextMenu from "./MindMapContextMenu";

interface MindMapContainerProps {
  isMapGenerated: boolean;
}

const MindMapContainer = ({ isMapGenerated }: MindMapContainerProps) => {
  // Use mutable ref object pattern instead of RefObject to allow setting current
  const containerRef = useRef<HTMLDivElement>(null);
  // Create a mutable ref for mind map instance
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  // State to track if mind map is ready for our custom context menu
  const [mindMap, setMindMap] = useState<MindElixirInstance | null>(null);
  
  const { isReady } = useMindMapInitializer(isMapGenerated, containerRef, mindMapRef);
  
  // Set up the mind map ref to state when it's ready
  useEffect(() => {
    if (isReady && mindMapRef.current) {
      setMindMap(mindMapRef.current);
    }
  }, [isReady, mindMapRef]);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-[calc(100vh-100px)] flex bg-card overflow-hidden relative">
        <MindMapContextMenu mindMap={mindMap}>
          <div 
            ref={containerRef} 
            className="flex-1 h-full" 
            style={{ background: '#f8f9fa' }}
          />
        </MindMapContextMenu>
        
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
