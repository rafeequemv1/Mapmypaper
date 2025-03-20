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

// Define color palette for nodes based on their level
const getNodeColors = (theme: MindMapTheme, level: number) => {
  const baseTheme = mindMapThemes[theme];
  
  // Create a palette of colors based on the theme
  const palette = {
    gray: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
    blue: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
    green: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
    purple: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
    peach: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'],
    pink: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FCE7F3'],
    yellow: ['#EAB308', '#FACC15', '#FDE047', '#FEF08A', '#FEF9C3'],
    mint: ['#16A34A', '#4ADE80', '#86EFAC', '#BBFBD0', '#DCFCE7'],
    coral: ['#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3', '#FFE4E6'],
    aqua: ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#CFFAFE'],
    lilac: ['#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF']
  };
  
  // Get colors for the current theme
  const colors = palette[theme] || palette.gray;
  
  // Get color based on level, with a maximum depth
  const colorIndex = Math.min(level, colors.length - 1);
  
  return {
    backgroundColor: level === 0 ? baseTheme.color : colors[colorIndex],
    color: '#000000', // Always use black text for better readability
    borderColor: baseTheme.color
  };
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, theme = 'green' }: MindMapViewerProps) => {
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
        // Add custom style to nodes based on their level
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get appropriate colors based on node level
          const { backgroundColor, color, borderColor } = getNodeColors(theme, level);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = backgroundColor;
          tpc.style.color = color;
          tpc.style.border = `2px solid ${borderColor}`;
          tpc.style.borderRadius = '8px';
          tpc.style.padding = '6px 12px';
          tpc.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '16px' : '14px';
          
          // Add transition for smooth color changes
          tpc.style.transition = 'background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s';
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
          });
        }
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
      
      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;
      
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
          
          // Use the theme's color for link elements
          const linkElements = containerRef.current.querySelectorAll('.fne-link');
          linkElements.forEach((link: Element) => {
            const linkElement = link as HTMLElement;
            linkElement.style.stroke = currentTheme.color;
            linkElement.style.strokeWidth = '2px';
          });
        }
        
        console.log(`Theme updated to: ${theme} (${currentTheme.name})`);
        
        // Force a redraw of all nodes to apply new theme
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
          style={{ 
            background: currentTheme.background,
            transition: 'background-color 0.5s ease'
          }}
        />
      </div>
    </div>
  );
};

export default MindMapViewer;
