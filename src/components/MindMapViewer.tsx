
import { useEffect, useRef } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";

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
        contextMenu: true,
        tools: {
          zoom: true,
          create: false,
          edit: false,
        },
        theme: {
          name: 'gray',
          background: '#f5f5f5',
          color: '#333',
          palette: [], // Required property
          cssVar: {}, // Required property
        }
      };

      const mind = new MindElixir(options);
      
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

      // Add mind elixir instance to window for debugging
      console.log("Mind Elixir initialized");
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
    <div className="w-full">
      <div className="border rounded-lg bg-card overflow-hidden">
        <h3 className="text-lg font-medium p-4 text-center border-b">Your Mindmap</h3>
        <div 
          ref={containerRef} 
          className="w-full h-[500px]" 
          style={{ background: '#f5f5f5' }}
        />
        <div className="text-center p-3 text-sm text-muted-foreground">
          You can drag to pan, use mouse wheel to zoom, and click nodes to expand/collapse.
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
