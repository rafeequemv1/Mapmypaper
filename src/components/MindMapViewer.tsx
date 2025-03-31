
import { useEffect, useRef, useState, useCallback } from "react";
import MindElixir, { MindElixirInstance, MindElixirData } from "mind-elixir";
import nodeMenu from "@mind-elixir/node-menu-neo";
import "../styles/node-menu.css";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

// Get node colors based on node level - Updated for black and white theme
const getNodeColors = (level: number, isDarkMode: boolean) => {
  if (isDarkMode) {
    return {
      backgroundColor: level === 0 ? '#333' : '#222',
      borderColor: level === 0 ? '#fff' : '#aaa',
      textColor: '#ffffff'
    };
  } else {
    return {
      backgroundColor: level === 0 ? '#000' : '#f3f3f3',
      borderColor: level === 0 ? '#000' : '#000',
      textColor: level === 0 ? '#fff' : '#000'
    };
  }
};

const MindMapViewer = ({ isMapGenerated, onMindMapReady, onExplainText, onRequestOpenChat }: MindMapViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindElixirInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasAttemptedInitialization, setHasAttemptedInitialization] = useState(false);

  // Check for dark mode
  useEffect(() => {
    // Check if the user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
    
    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize mind map
  const initializeMindMap = useCallback(() => {
    if (!containerRef.current || mindMapRef.current) return;
    
    setIsLoading(true);
    console.log("Initializing mind map...");
    
    // Get mind map data
    let data: MindElixirData | null = null;
    
    try {
      // First try to get the data from sessionStorage
      const savedData = sessionStorage.getItem('mindMapData');
      console.log("Retrieved mind map data from sessionStorage:", savedData ? "yes" : "no");
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log("Successfully parsed mind map data");
        
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
          data = parsedData;
        } else {
          console.error("Invalid mind map data structure:", parsedData);
          throw new Error("Invalid mind map data structure");
        }
      } else {
        console.log("No saved mind map data found, using default");
        // Use default mind map
        data = {
          nodeData: {
            id: 'root',
            topic: 'MapMyPaper',
            children: [
              {
                id: 'bd1',
                topic: 'No mindmap data',
                direction: 0 as const,
                children: [
                  { id: 'bd1-1', topic: 'Please generate a mindmap first' },
                ]
              }
            ]
          }
        };
      }
      
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
          name: 'custom',
          background: isDarkMode ? '#111' : '#f9f9f9',
          color: isDarkMode ? '#ffffff' : '#000000',
          palette: [],
          cssVar: {},
        },
        nodeMenu: true, // Explicitly enable the nodeMenu
        autoFit: true,
        // Add custom style to nodes based on their level - Updated for black and white theme
        beforeRender: (node: any, tpc: HTMLElement, level: number) => {
          // Get appropriate colors based on node level and dark mode
          const { backgroundColor, borderColor, textColor } = getNodeColors(level, isDarkMode);
          
          // Apply custom styling to nodes for a more elegant look
          tpc.style.backgroundColor = backgroundColor;
          tpc.style.color = textColor;
          tpc.style.border = `2px solid ${borderColor}`;
          tpc.style.borderRadius = '8px';
          tpc.style.padding = '10px 16px';
          tpc.style.boxShadow = isDarkMode 
            ? '0 3px 10px rgba(0,0,0,0.4)' 
            : '0 3px 10px rgba(0,0,0,0.05)';
          tpc.style.fontWeight = level === 0 ? 'bold' : 'normal';
          tpc.style.fontSize = level === 0 ? '20px' : '16px';
          tpc.style.fontFamily = "'system-ui', '-apple-system', 'Segoe UI', sans-serif";
          
          // Add transition for smooth color changes
          tpc.style.transition = 'all 0.3s ease';
          
          // Add hover effect
          tpc.addEventListener('mouseover', () => {
            tpc.style.boxShadow = isDarkMode 
              ? '0 5px 15px rgba(0,0,0,0.6)' 
              : '0 5px 15px rgba(0,0,0,0.15)';
            tpc.style.transform = 'translateY(-2px)';
          });
          
          tpc.addEventListener('mouseout', () => {
            tpc.style.boxShadow = isDarkMode 
              ? '0 3px 10px rgba(0,0,0,0.4)' 
              : '0 3px 10px rgba(0,0,0,0.05)';
            tpc.style.transform = 'translateY(0)';
          });
        }
      };

      // Create mind map instance
      const mind = new MindElixir(options);
      
      // Install the node menu plugin before init
      mind.install(nodeMenu);
      
      // Initialize the mind map with data
      console.log("Initializing mind map with data");
      mind.init(data);
      
      // Enable debug mode for better troubleshooting
      (window as any).mind = mind;
      
      // Add custom styling to connection lines - Updated for black and white theme
      setTimeout(() => {
        const linkElements = containerRef.current?.querySelectorAll('.fne-link');
        linkElements?.forEach((link: Element) => {
          const linkElement = link as SVGElement;
          linkElement.setAttribute('stroke-width', '2.5');
          linkElement.setAttribute('stroke', isDarkMode ? '#888' : '#555');
        });
      }, 100);
      
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
      
      setIsReady(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error initializing mind map:", error);
      toast({
        title: "Mind Map Error",
        description: "Failed to initialize mind map. Please try refreshing the page.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [isDarkMode, onMindMapReady, toast]);

  useEffect(() => {
    if (isMapGenerated && !hasAttemptedInitialization) {
      setHasAttemptedInitialization(true);
      
      // Delay initialization slightly to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMindMap();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isMapGenerated, hasAttemptedInitialization, initializeMindMap]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mindMapRef.current) {
        // Clean up mind map instance if needed
        mindMapRef.current = null;
      }
    };
  }, []);

  if (!isMapGenerated) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please upload a PDF to generate a mind map.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
            <p className="text-gray-700">Initializing mind map...</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full overflow-hidden relative">
          <div 
            ref={containerRef} 
            className="w-full h-full" 
            style={{ 
              background: isDarkMode 
                ? 'linear-gradient(90deg, #111 0%, #141414 100%)' 
                : 'linear-gradient(90deg, #f9f9f9 0%, #f3f3f3 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;
