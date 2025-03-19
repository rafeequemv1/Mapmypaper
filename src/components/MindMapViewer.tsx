
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react"; // Using RefreshCw from lucide-react

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
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

const MindMapViewer = ({ isMapGenerated, onMindMapReady }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // Reset function to retry mind map creation
  const resetAndRetry = () => {
    setError(null);
    
    // Clean up existing mind map if it exists
    if (mindMapRef.current) {
      try {
        // Try to clean up any DOM elements
        const el = containerRef.current;
        if (el) {
          el.innerHTML = ''; // Clear the container
        }
        // Reset the ref
        mindMapRef.current = null;
      } catch (cleanupErr) {
        console.error("Error cleaning up mind map:", cleanupErr);
      }
    }
    
    // Increment retry count to trigger useEffect
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (isMapGenerated && containerRef.current && !mindMapRef.current) {
      // Clear any previous error state
      setError(null);
      
      // Add a small delay to ensure DOM is ready
      timeoutId = window.setTimeout(() => {
        try {
          // Initialize the mind map
          initializeMindMap();
        } catch (err) {
          console.error("Top-level error in mind map initialization:", err);
          setError(`Failed to create mind map: ${err instanceof Error ? err.message : 'Unknown error'}`);
          toast({
            title: "Error loading mind map",
            description: "There was a problem creating the mind map visualization.",
            variant: "destructive"
          });
        }
      }, 500); // Increased timeout for more stability
    }
    
    return () => {
      // Clean up timeout on unmount
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      
      // Cleanup mind map
      if (mindMapRef.current) {
        try {
          // Clean up event listeners
          const mermaidContainer = containerRef.current;
          if (mermaidContainer) {
            const newContainer = mermaidContainer.cloneNode(false);
            if (mermaidContainer.parentNode) {
              mermaidContainer.parentNode.replaceChild(newContainer, mermaidContainer);
            }
          }
        } catch (error) {
          console.error("Error cleaning up mind map:", error);
        }
      }
    };
  }, [isMapGenerated, onMindMapReady, toast, retryCount]);

  const initializeMindMap = () => {
    if (!containerRef.current) {
      console.error("Mind map container ref is null");
      setError("Container element not found");
      return;
    }
    
    try {
      // Clear the container first to prevent stacking
      containerRef.current.innerHTML = '';
      
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
        autoFit: true,
      };

      console.log("Creating mind map instance...");
      const mind = new MindElixir(options);
      
      // Install the node menu plugin before init
      console.log("Installing node menu plugin...");
      mind.install(nodeMenu);
      
      // Get the generated mind map data from sessionStorage or use a default structure
      let data: MindElixirData;
      
      try {
        console.log("Loading mind map data...");
        const savedData = sessionStorage.getItem('mindMapData');
        
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            
            // Validate the data structure
            if (!parsedData || typeof parsedData !== 'object' || !parsedData.nodeData) {
              console.error("Invalid mind map data structure:", parsedData);
              throw new Error("Invalid mind map data structure");
            }
            
            // Ensure the data structure is compatible with mind-elixir
            // The nodeData should be an object with id, topic, and children properties
            const nodeData = parsedData.nodeData;
            
            // Ensure children is an array before processing
            if (nodeData.children && !Array.isArray(nodeData.children)) {
              console.error("Children is not an array:", nodeData.children);
              throw new Error("Invalid children structure in mind map data");
            }
            
            // Apply line breaks to node topics - use a proper deep clone to avoid reference issues
            const formatNodes = (node: any): any => {
              if (!node || typeof node !== 'object') {
                console.error("Invalid node during formatting:", node);
                return { id: 'error', topic: 'Invalid Node', children: [] };
              }
              
              // Create a new node object to avoid reference issues
              const formattedNode = {
                id: node.id || `node-${Math.random().toString(36).substr(2, 9)}`,
                topic: node.topic ? formatNodeText(node.topic) : 'Untitled',
                direction: node.direction !== undefined ? node.direction : undefined,
                children: []
              };
              
              // Process children if they exist
              if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                formattedNode.children = node.children.map((child: any) => formatNodes(child));
              }
              
              return formattedNode;
            };
            
            // Deep clone and format the node structure
            const formattedNodeData = formatNodes(nodeData);
            data = { nodeData: formattedNodeData };
            
            console.log("Mind map data processed successfully:", data);
          } catch (parseError) {
            console.error("Error processing mind map data:", parseError);
            throw new Error("Failed to process mind map data");
          }
        } else {
          console.log("No saved data found, using default structure");
          // Default fallback structure
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
                    { id: 'bd1-1', topic: 'Problem Statement', children: [] },
                    { id: 'bd1-2', topic: 'Research Objectives', children: [] }
                  ]
                },
                {
                  id: 'bd2',
                  topic: 'Methodology',
                  direction: 0 as const,
                  children: [
                    { id: 'bd2-1', topic: 'Data Collection', children: [] },
                    { id: 'bd2-2', topic: 'Analysis Techniques', children: [] }
                  ]
                },
                {
                  id: 'bd3',
                  topic: 'Results',
                  direction: 1 as const,
                  children: [
                    { id: 'bd3-1', topic: 'Key Finding 1', children: [] },
                    { id: 'bd3-2', topic: 'Key Finding 2', children: [] },
                  ]
                },
                {
                  id: 'bd4',
                  topic: 'Conclusion',
                  direction: 1 as const,
                  children: [
                    { id: 'bd4-1', topic: 'Summary', children: [] },
                    { id: 'bd4-2', topic: 'Future Work', children: [] }
                  ]
                }
              ]
            }
          };
        }
      } catch (dataError) {
        console.error("Error loading mind map data:", dataError);
        // More robust fallback structure in case of error
        data = {
          nodeData: {
            id: 'root',
            topic: 'Error\nLoading\nMind Map',
            children: [
              { 
                id: 'error1', 
                topic: 'There was an error loading the mind map data', 
                direction: 0 as const,
                children: [] 
              }
            ]
          }
        };
      }

      // Initialize the mind map with data in a try-catch block
      try {
        console.log("Initializing mind map with data...");
        mind.init(data);
        console.log("Mind map initialized successfully");
        
        mindMapRef.current = mind;
        
        // Notify parent component that mind map is ready
        if (onMindMapReady) {
          onMindMapReady(mind);
        }
        
        // Set a timeout to ensure the mind map is rendered before scaling
        window.setTimeout(() => {
          setIsReady(true);
          console.log("Mind map ready state set to true");
        }, 300);
      } catch (initError) {
        console.error("Error initializing mind map with data:", initError);
        setError(`Error initializing mind map: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
        throw initError;
      }
    } catch (error) {
      console.error("Fatal error creating mind map:", error);
      setError(`Failed to create mind map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: "Error loading mind map",
        description: "There was a problem creating the mind map visualization.",
        variant: "destructive"
      });
    }
  };

  if (!isMapGenerated) {
    return null;
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error loading mind map</AlertTitle>
          <AlertDescription className="mb-4">
            There was a problem creating the mind map visualization.
            <div className="text-sm opacity-90 mt-2">{error}</div>
          </AlertDescription>
          <button 
            onClick={resetAndRetry}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full bg-[#f5f5f5] overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: '#f5f5f5' }}
          id="mind-elixir-container"
        />
      </div>
    </div>
  );
};

export default MindMapViewer;
