
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { Keyboard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MindMapViewerProps {
  isMapGenerated: boolean;
}

// Modify the EventMap to actually extend the library's EventMap type
type MindElixirEventMap = {
  'operation': any;
  'selectNode': any;
  'expandNode': any;
  'showNodeMenu': any;
  'hideNodeMenu': any;
  // Add other event types as needed
}

// Helper function to format node text with line breaks
const formatNodeText = (text: string, wordsPerLine: number = 4): string => {
  if (!text) return '';
  
  const words = text.split(' ');
  if (words.length <= wordsPerLine) return text;
  
  let result = '';
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine).join(' ');
    result += chunk + (i + wordsPerLine < words.length ? '\n' : '');
  }
  
  return result;
};

const MindMapViewer = ({ isMapGenerated }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Initialize the mind map only once when it's generated
      const options = {
        el: containerRef.current,
        direction: 1 as const,
        draggable: true,
        editable: true,
        contextMenu: true, // This enables the context menu
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
        nodeMenu: true, // Enable the nodeMenu plugin
        autoFit: true, // Enable auto-fit for initial rendering
      };

      // Create mind map instance
      const mind = new MindElixir(options);
      
      // Install the node menu plugin before init
      mind.install(nodeMenu);
      
      // Get the generated mind map data from sessionStorage or use a default structure
      let data: MindElixirData;
      
      try {
        const savedData = sessionStorage.getItem('mindMapData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Apply line breaks to node topics
          const formatNodes = (node: any) => {
            if (node.topic) {
              node.topic = formatNodeText(node.topic);
            }
            
            if (node.children && node.children.length > 0) {
              node.children.forEach(formatNodes);
            }
            
            return node;
          };
          
          // Format the root node and all children
          if (parsedData.nodeData) {
            formatNodes(parsedData.nodeData);
          }
          
          data = parsedData;
          console.log("Using mind map data from Gemini:", data);
        } else {
          // Fallback to default data if nothing is in sessionStorage
          data = {
            nodeData: {
              id: 'root',
              topic: 'Research\nPaper\nTitle',
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
          console.log("Using default mind map data");
        }
      } catch (error) {
        console.error("Error parsing mind map data:", error);
        // Use default data in case of parsing error
        data = {
          nodeData: {
            id: 'root',
            topic: 'Error\nLoading\nMind Map',
            children: [
              { id: 'error1', topic: 'There was an error loading the mind map data', direction: 0 as const }
            ]
          }
        };
      }

      // Initialize the mind map with data
      mind.init(data);
      
      // Register event listeners for debugging
      // Use type assertion to any to bypass the TypeScript error
      (mind.bus.addListener as any)('operation', (operation: any) => {
        console.log('Mind map operation:', operation);
      });
      
      (mind.bus.addListener as any)('selectNode', (node: any) => {
        console.log('Node selected:', node);
      });

      // Add a specific listener for right-click events
      // Use type assertion to bypass the TypeScript error
      (mind.bus.addListener as any)('showNodeMenu', (node: any, e: any) => {
        console.log('Node menu shown for node:', node);
      });
      
      // Function to fit the mind map within the container
      const fitMindMap = () => {
        if (!containerRef.current || !mindMapRef.current) return;
        
        // Get the mind map's root element
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
      setTimeout(() => {
        fitMindMap();
        setIsReady(true);
      }, 300);
      
      mindMapRef.current = mind;

      // Log the mind map instance for debugging
      console.log("Mind Elixir initialized with options:", options);
      console.log("Mind Elixir instance:", mind);
      console.log("Node menu plugin status:", nodeMenu);
      
      // Add resize handler to ensure proper sizing when window resizes
      const handleResize = () => fitMindMap();
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        mindMapRef.current = null;
      };
    }
  }, [isMapGenerated]);

  // Function to handle manually opening node menu for testing
  const testNodeMenu = () => {
    if (mindMapRef.current) {
      console.log("Attempting to manually trigger node menu");
      
      // Find a node element in the DOM
      const nodeEl = document.querySelector('.mind-elixir-node');
      if (nodeEl) {
        // Simulate a right-click on the node
        const evt = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
        });
        nodeEl.dispatchEvent(evt);
        console.log("Triggered contextmenu event on node element");
      } else {
        console.log("No node elements found in DOM");
      }
    }
  };

  if (!isMapGenerated) {
    return null;
  }

  const shortcuts = [
    { key: 'Enter', action: 'Insert sibling node' },
    { key: 'Shift + Enter', action: 'Insert sibling node before' },
    { key: 'Tab', action: 'Insert child node' },
    { key: 'Ctrl + Enter', action: 'Insert parent node' },
    { key: 'F1', action: 'Center mind map' },
    { key: 'F2', action: 'Edit current node' },
    { key: '↑', action: 'Select previous node' },
    { key: '↓', action: 'Select next node' },
    { key: '← / →', action: 'Select nodes on the left/right' },
    { key: 'PageUp / Alt + ↑', action: 'Move up' },
    { key: 'PageDown / Alt + ↓', action: 'Move down' },
    { key: 'Ctrl + ↑', action: 'Use two-sided layout' },
    { key: 'Ctrl + ←', action: 'Use left-sided layout' },
    { key: 'Ctrl + →', action: 'Use right-sided layout' },
    { key: 'Delete', action: 'Remove node' },
    { key: 'Ctrl + C', action: 'Copy' },
    { key: 'Ctrl + V', action: 'Paste' },
    { key: 'Ctrl + Z', action: 'Undo' },
    { key: 'Ctrl + Y', action: 'Redo' },
    { key: 'Ctrl + +', action: 'Zoom in mind map' },
    { key: 'Ctrl + -', action: 'Zoom out mind map' },
    { key: 'Ctrl + 0', action: 'Reset size' },
  ];

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-[calc(100vh-100px)] bg-card overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#f5f5f5' }}
        />
        
        {/* Shortcuts button - positioned next to the toolbox */}
        {isReady && (
          <div className="absolute top-6 right-5 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="flex items-center justify-center w-7 h-7 bg-white rounded-md shadow-sm hover:bg-gray-100 transition-colors ml-2"
                    onClick={testNodeMenu} // Add click handler for testing
                  >
                    <Keyboard className="h-4 w-4 text-gray-700" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-2 bg-white shadow-md rounded-md w-64 max-h-80 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
                  <ul className="space-y-1 text-xs">
                    {shortcuts.map((shortcut, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="font-medium px-1.5 py-0.5 bg-gray-100 rounded">{shortcut.key}</span>
                        <span className="text-gray-600">{shortcut.action}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <div className="text-center p-1 text-xs text-muted-foreground absolute bottom-0 left-0 right-0 bg-background/80">
          Right-click on a node to open the context menu with options. You can also drag to pan, use mouse wheel to zoom.
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
