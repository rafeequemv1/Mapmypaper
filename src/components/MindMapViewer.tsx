import { useEffect, useRef, useState } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import ThemeSelect, { MindMapTheme, mindMapThemes } from "@/components/mindmap/ThemeSelect";

interface MindMapViewerProps {
  isMapGenerated: boolean;
  onMindMapReady?: (mindMap: MindElixirInstance) => void;
  onExplainText?: (text: string) => void;
  onRequestOpenChat?: () => void;
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

// Get node colors based on the selected theme and node level
const getNodeColors = (level: number, theme: MindMapTheme) => {
  const { background, color } = mindMapThemes[theme];
  
  return {
    backgroundColor: background,
    borderColor: color,
    textColor: '#333333' // Dark text for better readability across all themes
  };
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<MindMapTheme>('purple'); // Default theme
  const { toast } = useToast();

  // Effect to handle theme changes for existing mind map
  useEffect(() => {
    if (mindMapRef.current && containerRef.current) {
      // Update background color of the container
      containerRef.current.style.background = `linear-gradient(90deg, #F9F7F3 0%, ${mindMapThemes[theme].background} 100%)`;
      
      // Re-render the mind map to apply new theme
      mindMapRef.current.refresh();
    }
  }, [theme]);

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
          name: 'colorful',
          background: mindMapThemes[theme].background,
          color: mindMapThemes[theme].color,
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get appropriate colors based on node level and theme
          const { backgroundColor, borderColor, textColor } = getNodeColors(level, theme);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = level === 0 ? backgroundColor : mindMapThemes[theme].background;
          tpc.style.color = textColor;
          tpc.style.border = `2px solid ${level === 0 ? borderColor : mindMapThemes[theme].color}`;
          tpc.style.borderRadius = '12px';
          tpc.style.padding = '10px 16px';
          tpc.style.boxShadow = '0 3px 10px rgba(0,0,0,0.05)';
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '20px' : '16px';
          tpc.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
          
          // Add transition for smooth color changes
          tpc.style.transition = 'all 0.3s ease';
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
            tpc.style.transform = 'translateY(-2px)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = '0 3px 10px rgba(0,0,0,0.05)';
            tpc.style.transform = 'translateY(0)';
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
      
      // Add custom styling to connection lines
      const linkElements = containerRef.current.querySelectorAll('.fne-link');
      linkElements.forEach((link: Element) => {
        const linkElement = link as SVGElement;
        linkElement.setAttribute('stroke-width', '2.5');
        linkElement.setAttribute('stroke', mindMapThemes[theme].color);
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
  }, [isMapGenerated, onMindMapReady, toast, onExplainText, onRequestOpenChat, theme]);

  const handleThemeChange = (newTheme: MindMapTheme) => {
    setTheme(newTheme);
    
    // Update connection lines color
    if (containerRef.current) {
      const linkElements = containerRef.current.querySelectorAll('.fne-link');
      linkElements.forEach((link: Element) => {
        const linkElement = link as SVGElement;
        linkElement.setAttribute('stroke', mindMapThemes[newTheme].color);
      });
    }
  };

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
            background: `linear-gradient(90deg, #F9F7F3 0%, ${mindMapThemes[theme].background} 100%)`,
            transition: 'background-color 0.5s ease'
          }}
        />
        
        {/* Theme selector in the top-right corner */}
        <div className="absolute top-2 right-2 z-10">
          <ThemeSelect value={theme} onValueChange={handleThemeChange} />
        </div>
      </div>
    </div>
  );
};

export default MindMapViewer;
