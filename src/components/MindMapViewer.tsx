
import { useEffect, useRef } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu";
import "@mind-elixir/node-menu/dist/style.css";

interface MindMapViewerProps {
  isMapGenerated: boolean;
}

const MindMapViewer = ({ isMapGenerated }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map only once when it's generated
      const options = {
        el: containerRef.current,
        direction: 1 as const, // Using 'as const' to specify it's specifically 1 (right direction)
        draggable: true,
        editable: true, // Enable editing for context menu to work properly
        contextMenu: true,
        tools: {
          zoom: true,
          create: true, // Enable create feature
          edit: true,   // Enable edit feature
        },
        theme: {
          name: 'gray',
          background: '#f5f5f5',
          color: '#333',
          palette: [], // Required property
          cssVar: {}, // Required property
        },
        nodeMenu: true, // Explicitly enable node menu
      };

      const mind = new MindElixir(options);
      
      // Install the node menu plugin correctly
      mind.install(nodeMenu);
      
      // Create sample mindmap data using the correct types
      const data: MindElixirData = {
        nodeData: {
          id: 'root',
          topic: 'Research Paper Title',
          // Removed the 'root: true' property as it's not part of the NodeObj type
          children: [
            {
              id: 'bd1',
              topic: 'Introduction',
              direction: 0 as const, // Using 'as const' to specify literal 0
              children: [
                { id: 'bd1-1', topic: 'Problem Statement' },
                { id: 'bd1-2', topic: 'Research Objectives' }
              ]
            },
            {
              id: 'bd2',
              topic: 'Methodology',
              direction: 0 as const, // Using 'as const' to specify literal 0
              children: [
                { id: 'bd2-1', topic: 'Data Collection' },
                { id: 'bd2-2', topic: 'Analysis Techniques' }
              ]
            },
            {
              id: 'bd3',
              topic: 'Results',
              direction: 1 as const, // Using 'as const' to specify literal 1
              children: [
                { id: 'bd3-1', topic: 'Key Finding 1' },
                { id: 'bd3-2', topic: 'Key Finding 2' },
              ]
            },
            {
              id: 'bd4',
              topic: 'Conclusion',
              direction: 1 as const, // Using 'as const' to specify literal 1
              children: [
                { id: 'bd4-1', topic: 'Summary' },
                { id: 'bd4-2', topic: 'Future Work' }
              ]
            }
          ]
        }
      };

      mind.init(data);
      mindMapRef.current = mind;

      // Instead of using specific event listeners that might not be in the EventMap,
      // let's just log the mind map instance for debugging
      console.log("Mind Elixir initialized with options:", options);

      // Add mind elixir instance to window for debugging
      console.log("Mind Elixir instance:", mind);
    }

    // Cleanup function to remove the mind map when component unmounts
    return () => {
      if (mindMapRef.current) {
        // Cleanup if needed
        mindMapRef.current = null;
      }
    };
  }, [isMapGenerated]);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full flex-1 bg-card overflow-hidden">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#f5f5f5' }}
        />
        <div className="text-center p-1 text-xs text-muted-foreground absolute bottom-0 left-0 right-0 bg-background/80">
          You can drag to pan, use mouse wheel to zoom, and click nodes to expand/collapse. Right-click on nodes for more options.
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
