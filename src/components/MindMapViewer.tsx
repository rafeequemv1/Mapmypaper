
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
        direction: 1 as const,
        draggable: true,
        editable: true,
        contextMenu: true,
        tools: {
          zoom: true,
          create: true,
          edit: true,
        },
        theme: {
          name: 'gray',
          background: '#f5f5f5',
          color: '#333',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true,
        autoFit: true, // Enable auto-fit for initial rendering
      };

      const mind = new MindElixir(options);
      
      // Install the node menu plugin correctly
      mind.install(nodeMenu);
      
      // Create sample mindmap data using the correct types
      const data: MindElixirData = {
        nodeData: {
          id: 'root',
          topic: 'Research Paper Title',
          children: [
            {
              id: 'bd1',
              topic: 'Introduction',
              direction: 0 as const,
              children: [
                { id: 'bd1-1', topic: 'Problem Statement' },
                { id: 'bd1-2', topic: 'Research Objectives' }
              ]
            },
            {
              id: 'bd2',
              topic: 'Methodology',
              direction: 0 as const,
              children: [
                { id: 'bd2-1', topic: 'Data Collection' },
                { id: 'bd2-2', topic: 'Analysis Techniques' }
              ]
            },
            {
              id: 'bd3',
              topic: 'Results',
              direction: 1 as const,
              children: [
                { id: 'bd3-1', topic: 'Key Finding 1' },
                { id: 'bd3-2', topic: 'Key Finding 2' },
              ]
            },
            {
              id: 'bd4',
              topic: 'Conclusion',
              direction: 1 as const,
              children: [
                { id: 'bd4-1', topic: 'Summary' },
                { id: 'bd4-2', topic: 'Future Work' }
              ]
            }
          ]
        }
      };

      mind.init(data);
      
      // Function to fit the mind map within the container
      const fitMindMap = () => {
        if (!containerRef.current || !mindMapRef.current) return;
        
        // Get the mind map's root element (ME instance has a container property)
        const mindMapRoot = mind.container;
        if (!mindMapRoot) return;
        
        // Get dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const rootRect = mindMapRoot.getBoundingClientRect();
        
        // Calculate the scale needed to fit content
        const scaleX = (containerRect.width * 0.9) / rootRect.width;
        const scaleY = (containerRect.height * 0.9) / rootRect.height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
        
        // Apply scale and center
        mindMapRef.current.scale(scale);
        mindMapRef.current.toCenter();
      };
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(fitMindMap, 300);
      
      mindMapRef.current = mind;

      // Log the mind map instance for debugging
      console.log("Mind Elixir initialized with options:", options);
      console.log("Mind Elixir instance:", mind);
      
      // Add resize handler to ensure proper sizing when window resizes
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
        <div className="text-center p-1 text-xs text-muted-foreground absolute bottom-0 left-0 right-0 bg-background/80">
          You can drag to pan, use mouse wheel to zoom, and click nodes to expand/collapse. Right-click on nodes for more options.
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
