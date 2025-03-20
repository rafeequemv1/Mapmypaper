
import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { MindMapTheme, mindMapThemes } from "./mindmap/ThemeSelect";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  theme?: MindMapTheme;
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

// Helper to get node color based on theme and depth
const getNodeColor = (theme: MindMapTheme, node: any): string | undefined => {
  const currentTheme = mindMapThemes[theme];
  
  if (theme === 'soft' && currentTheme.nodeColors) {
    // For soft theme, use specific branch colors
    if (node.id === 'root') {
      return currentTheme.nodeColors.root;
    }
    
    // Determine which branch based on node structure or ID pattern
    // This is a simple example - you might need a more complex logic
    // based on your mind map structure
    const nodeId = node.id || '';
    
    if (nodeId.includes('bd1')) {
      return currentTheme.nodeColors.branch1;
    } else if (nodeId.includes('bd2')) {
      return currentTheme.nodeColors.branch2;
    } else if (nodeId.includes('bd3')) {
      return currentTheme.nodeColors.branch3;
    } else {
      // Rotate between branch colors for other nodes
      const branchKeys = Object.keys(currentTheme.nodeColors).filter(k => k !== 'root');
      const randomBranch = branchKeys[Math.floor(Math.random() * branchKeys.length)];
      return currentTheme.nodeColors[randomBranch as keyof typeof currentTheme.nodeColors];
    }
  }
  
  // Default to theme color if no specific node coloring
  return currentTheme.color;
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, theme = 'gray' }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  const currentTheme = mindMapThemes[theme];

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
          name: theme,
          background: currentTheme.background,
          color: currentTheme.color,
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
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
        } else {
          data = {
            nodeData: {
              id: 'root',
              topic: 'Mind\nMapping',
              children: [
                {
                  id: 'bd1',
                  topic: 'Organization',
                  direction: 0 as const,
                  children: [
                    { id: 'bd1-1', topic: 'Plan' },
                    { id: 'bd1-2', topic: 'Study' },
                    { id: 'bd1-3', topic: 'System' },
                    { id: 'bd1-4', topic: 'Breaks' }
                  ]
                },
                {
                  id: 'bd2',
                  topic: 'Learning\nStyle',
                  direction: 0 as const,
                  children: [
                    { id: 'bd2-1', topic: 'Read' },
                    { id: 'bd2-2', topic: 'Listen' },
                    { id: 'bd2-3', topic: 'Summarize' }
                  ]
                },
                {
                  id: 'bd3',
                  topic: 'Habits',
                  direction: 0 as const,
                  children: []
                },
                {
                  id: 'bd4',
                  topic: 'Goals',
                  direction: 1 as const,
                  children: [
                    { id: 'bd4-1', topic: 'Research' },
                    { id: 'bd4-2', topic: 'Lecture' },
                    { id: 'bd4-3', topic: 'Conclusions' }
                  ]
                },
                {
                  id: 'bd5',
                  topic: 'Motivation',
                  direction: 1 as const,
                  children: [
                    { id: 'bd5-1', topic: 'Tips' },
                    { id: 'bd5-2', topic: 'Roadmap' }
                  ]
                },
                {
                  id: 'bd6',
                  topic: 'Review',
                  direction: 1 as const,
                  children: [
                    { id: 'bd6-1', topic: 'Notes' },
                    { id: 'bd6-2', topic: 'Method' },
                    { id: 'bd6-3', topic: 'Discuss' }
                  ]
                }
              ]
            }
          };
        }
      } catch (error) {
        console.error("Error parsing mind map data:", error);
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
      
      // Apply soft theme colors to nodes if using the soft theme
      if (theme === 'soft' && currentTheme.nodeColors) {
        // Add custom colors to nodes based on their position/depth
        mind.bus.addListener('operation', (operation: any) => {
          if (operation.name === 'finishInit') {
            // Style all nodes after initialization
            const applyNodeColors = (node: any) => {
              const nodeElement = document.querySelector(`[data-nodeid="${node.id}"]`);
              if (nodeElement) {
                const topicElement = nodeElement.querySelector('.topic');
                if (topicElement) {
                  const backgroundColor = getNodeColor(theme, node);
                  if (backgroundColor) {
                    (topicElement as HTMLElement).style.backgroundColor = backgroundColor;
                  }
                }
              }
              
              if (node.children && node.children.length > 0) {
                node.children.forEach(applyNodeColors);
              }
            };
            
            // Apply colors to all nodes
            applyNodeColors(data.nodeData);
          }
        });
      }
      
      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;
      console.log("Mind map instance:", mind);
      console.log("Node menu plugin:", nodeMenu);
      
      // Setup event handlers for the node menu
      mind.bus.addListener('selectNode', (node: any) => {
        console.log('Node selected:', node);
      });
      
      // Fix: Use a type assertion that bypasses the strict type checking
      // @ts-ignore - Ignore the TypeScript error since we know 'showNodeMenu' is a valid event
      mind.bus.addListener('showNodeMenu', (node: any, e: MouseEvent) => {
        console.log('Node menu shown:', node, e);
      });
      
      mindMapRef.current = mind;
      
      // Notify parent component that mind map is ready
      if (onMindMapReady) {
        onMindMapReady(mind);
      }
      
      // Show a toast notification to inform users about right-click functionality
      toast({
        title: "Mind Map Ready",
        description: "Right-click on any node to access the node menu with options.",
        duration: 5000,
      });
      
      // Set a timeout to ensure the mind map is rendered before scaling
      setTimeout(() => {
        setIsReady(true);
      }, 300);
    }
  }, [isMapGenerated, onMindMapReady, toast, theme, currentTheme]);

  // Update theme when it changes
  useEffect(() => {
    if (mindMapRef.current && theme) {
      try {
        const currentTheme = mindMapThemes[theme];
        
        // Apply the new theme to the mind map container
        if (containerRef.current) {
          containerRef.current.style.background = currentTheme.background;
        }
        
        // Apply custom node colors for soft theme
        if (theme === 'soft' && currentTheme.nodeColors) {
          const applyNodeColors = (node: any) => {
            const nodeElement = document.querySelector(`[data-nodeid="${node.id}"]`);
            if (nodeElement) {
              const topicElement = nodeElement.querySelector('.topic');
              if (topicElement) {
                const backgroundColor = getNodeColor(theme, node);
                if (backgroundColor) {
                  (topicElement as HTMLElement).style.backgroundColor = backgroundColor;
                }
              }
            }
            
            if (node.children && node.children.length > 0) {
              node.children.forEach(applyNodeColors);
            }
          };
          
          // Apply colors to current nodes
          if (mindMapRef.current.nodeData) {
            applyNodeColors(mindMapRef.current.nodeData);
          }
        }
        
        console.log(`Theme updated to: ${theme} (${currentTheme.name})`);
        
        // We may need to trigger a re-render of the mind map
        mindMapRef.current.refresh();
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  }, [theme]);

  if (!isMapGenerated) {
    return null;
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <div className="w-full h-full overflow-hidden relative">
        <div 
          ref={containerRef} 
          className="w-full h-full" 
          style={{ background: currentTheme.background }}
        />
      </div>
    </div>
  );
};

export default MindMapViewer;
